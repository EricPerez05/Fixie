import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { log } from "@/lib/log";
import { enforceSafetyRules } from "@/lib/scan/safety";
import { canGrow, GroveEntry, MAX_GROVE_ENTRIES, type GroveLogRequest } from "./entries";

/*
 * The Grove's server side: Supabase Postgres for entries, Supabase Storage
 * for photos. Every call runs as the signed-in (anonymous) user, so
 * row-level security, not this code, is what keeps one user's Grove from
 * another's. See supabase/migrations for the policies.
 */

export const PHOTO_BUCKET = "grove-photos";
// Long enough to scroll the Grove, short enough that a leaked URL soon dies.
// The client refetches the list when a photo fails to load.
export const SIGNED_URL_SECONDS = 60 * 60;

const TABLE = "grove_entries";

export type GroveFailure = "unauthorized" | "not_growable" | "not_found" | "server";
export type GroveOutcome<T> = { ok: true; value: T } | { ok: false; reason: GroveFailure };

/** A row as Postgres returns it. Validated, never cast: it came over the network. */
const GroveRow = z.object({
  id: z.string(),
  scanned_at: z.string(),
  result: z.unknown(),
  photo_path: z.string().nullable(),
});
type GroveRow = z.infer<typeof GroveRow>;

const ROW_COLUMNS = "id, scanned_at, result, photo_path";

// Postgres unique_violation: the entry id already exists.
const UNIQUE_VIOLATION = "23505";

/**
 * The caller's user id, signing them in anonymously the first time.
 * Returns null if Supabase refuses (anonymous sign-ins disabled, its own
 * rate limit, an outage); the route answers 503 and the client keeps its
 * local Grove. Never throws.
 */
export async function ensureUser(client: SupabaseClient): Promise<string | null> {
  try {
    const { data } = await client.auth.getUser();
    if (data.user) return data.user.id;
    const { data: signedIn, error } = await client.auth.signInAnonymously();
    if (error || !signedIn.user) {
      log.warn("grove.sign_in_failed", { reason: error?.code ?? "no_user" });
      return null;
    }
    return signedIn.user.id;
  } catch (error) {
    log.error("grove.auth_error", { reason: error instanceof Error ? error.name : "Unknown" });
    return null;
  }
}

/**
 * Converts a row to an entry, re-validating the stored result and
 * re-applying the safety rules. Returns null for rows that no longer pass.
 */
export function rowToEntry(row: GroveRow, photoUrl?: string): GroveEntry | null {
  const parsed = GroveEntry.safeParse({
    id: row.id,
    // Postgres answers "2026-10-04 12:00:00+00"; the contract wants ISO with Z.
    scannedAt: toIso(row.scanned_at),
    result: row.result,
    hasPhoto: row.photo_path !== null,
    photoUrl,
  });
  if (!parsed.success) return null;
  // SAFETY: a stored result gets the same rules as a fresh scan.
  const result = enforceSafetyRules(parsed.data.result);
  return canGrow(result) ? { ...parsed.data, result } : null;
}

function toIso(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toISOString();
}

function photoPath(userId: string, entryId: string): string {
  return `${userId}/${entryId}.jpg`;
}

/** Signed URLs for the given storage paths, keyed by path. Missing ones are left out. Never throws. */
async function signPhotos(client: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  try {
    const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (error) {
      log.warn("grove.sign_urls_failed", { reason: error.name, count: paths.length });
      return urls;
    }
    for (const signed of data) {
      if (signed.path && signed.signedUrl) urls.set(signed.path, signed.signedUrl);
    }
  } catch (error) {
    log.warn("grove.sign_urls_failed", { reason: error instanceof Error ? error.name : "Unknown" });
  }
  return urls;
}

function parseRows(data: unknown): GroveRow[] {
  const parsed = z.array(GroveRow).safeParse(data);
  return parsed.success ? parsed.data : [];
}

/**
 * The caller's Grove, oldest first (the order the tree grows), with signed
 * photo URLs. Keeps the newest MAX_GROVE_ENTRIES. Rows that fail validation
 * are dropped, not fatal.
 */
export async function listEntries(client: SupabaseClient): Promise<GroveOutcome<GroveEntry[]>> {
  const { data, error } = await client
    .from(TABLE)
    .select(ROW_COLUMNS)
    .order("logged_at", { ascending: false })
    .limit(MAX_GROVE_ENTRIES);
  if (error) {
    log.error("grove.list_failed", { code: error.code });
    return { ok: false, reason: "server" };
  }
  const rows = parseRows(data).reverse();
  const urls = await signPhotos(
    client,
    rows.flatMap((row) => (row.photo_path ? [row.photo_path] : [])),
  );
  const entries = rows.flatMap((row) => {
    const entry = rowToEntry(row, row.photo_path ? urls.get(row.photo_path) : undefined);
    return entry ? [entry] : [];
  });
  return { ok: true, value: entries };
}

/** True for bytes that start like a JPEG. The bucket only ever serves image/jpeg. */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

async function findEntry(client: SupabaseClient, id: string): Promise<GroveEntry | null> {
  const { data } = await client.from(TABLE).select(ROW_COLUMNS).eq("id", id).maybeSingle();
  const row = GroveRow.safeParse(data);
  if (!row.success) return null;
  const urls = row.data.photo_path ? await signPhotos(client, [row.data.photo_path]) : new Map<string, string>();
  return rowToEntry(row.data, row.data.photo_path ? urls.get(row.data.photo_path) : undefined);
}

/** Uploads the thumbnail. Returns its storage path, or null if it couldn't be stored. Never throws. */
async function uploadPhoto(client: SupabaseClient, path: string, base64: string): Promise<string | null> {
  const bytes = Buffer.from(base64, "base64");
  // SECURITY: only store what we'll later serve as image/jpeg.
  if (!isJpeg(bytes)) {
    log.warn("grove.photo_rejected", { reason: "not_jpeg" });
    return null;
  }
  try {
    const { error } = await client.storage
      .from(PHOTO_BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (error) {
      log.warn("grove.photo_upload_failed", { reason: error.name });
      return null;
    }
    return path;
  } catch (error) {
    log.warn("grove.photo_upload_failed", { reason: error instanceof Error ? error.name : "Unknown" });
    return null;
  }
}

async function removePhoto(client: SupabaseClient, path: string): Promise<void> {
  try {
    const { error } = await client.storage.from(PHOTO_BUCKET).remove([path]);
    // An orphaned photo is private and only costs storage; say so and move on.
    if (error) log.warn("grove.photo_orphaned", { reason: error.name });
  } catch (error) {
    log.warn("grove.photo_orphaned", { reason: error instanceof Error ? error.name : "Unknown" });
  }
}

/**
 * Logs a result to the caller's Grove, with its photo when one is sent.
 * A photo that can't be stored doesn't block the entry: the branch just
 * shows its fruit. Re-sending an `id` that already exists returns that entry,
 * so a retried migration can't plant duplicates.
 */
export async function createEntry(
  client: SupabaseClient,
  userId: string,
  request: GroveLogRequest,
): Promise<GroveOutcome<GroveEntry>> {
  // SAFETY: same rules as a fresh scan, and only identified results grow.
  const result = enforceSafetyRules(request.result);
  if (!canGrow(result)) return { ok: false, reason: "not_growable" };

  if (request.id) {
    const existing = await findEntry(client, request.id);
    if (existing) return { ok: true, value: existing };
  }

  const id = request.id ?? randomUUID();
  const storedPath = request.photo ? await uploadPhoto(client, photoPath(userId, id), request.photo) : null;

  const { data, error } = await client
    .from(TABLE)
    .insert({
      id,
      user_id: userId,
      scanned_at: request.scannedAt,
      result,
      item: result.item,
      fairy: result.fairy,
      recyclable: result.recyclable,
      photo_path: storedPath,
    })
    .select(ROW_COLUMNS)
    .single();

  if (error) {
    if (storedPath) await removePhoto(client, storedPath);
    // Another user's row with this id, which RLS hides, also lands here.
    log.error("grove.insert_failed", { code: error.code, isDuplicate: error.code === UNIQUE_VIOLATION });
    return { ok: false, reason: "server" };
  }

  const row = GroveRow.safeParse(data);
  const urls = storedPath ? await signPhotos(client, [storedPath]) : new Map<string, string>();
  const entry = row.success ? rowToEntry(row.data, storedPath ? urls.get(storedPath) : undefined) : null;
  if (!entry) {
    log.error("grove.insert_unreadable");
    return { ok: false, reason: "server" };
  }
  return { ok: true, value: entry };
}

/**
 * Deletes one of the caller's entries and its photo. "not_found" when the id
 * isn't theirs (RLS makes another user's row look the same as a missing one).
 */
export async function deleteEntry(client: SupabaseClient, id: string): Promise<GroveOutcome<null>> {
  const { data, error } = await client.from(TABLE).delete().eq("id", id).select("photo_path");
  if (error) {
    log.error("grove.delete_failed", { code: error.code });
    return { ok: false, reason: "server" };
  }
  const deleted = z.array(z.object({ photo_path: z.string().nullable() })).safeParse(data);
  if (!deleted.success || deleted.data.length === 0) return { ok: false, reason: "not_found" };
  for (const { photo_path: path } of deleted.data) {
    if (path) await removePhoto(client, path);
  }
  return { ok: true, value: null };
}
