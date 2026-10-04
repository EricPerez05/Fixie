import { log } from "@/lib/log";

/*
 * Grove photos kept on this device, in IndexedDB rather than localStorage:
 * localStorage holds ~5MB of strings for the whole site, and the entries
 * already use part of it. Only the newest MAX_LOCAL_PHOTOS are kept; older
 * branches fall back to their glowing fruit. Every function resolves (never
 * rejects): a missing or blocked IndexedDB just means no polaroids.
 */

const DB_NAME = "fixie-grove";
const STORE = "photos";
export const MAX_LOCAL_PHOTOS = 50;

interface PhotoRecord {
  id: string;
  savedAt: number;
  /** JPEG bytes. Stored as an ArrayBuffer, which every IndexedDB can clone. */
  bytes: ArrayBuffer;
}

/** Which photos to drop so only the newest `max` remain. Pure. */
export function photosToEvict(records: readonly { id: string; savedAt: number }[], max: number): string[] {
  return [...records]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(max)
    .map((record) => record.id);
}

let opening: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  opening ??= new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        log.warn("grove.photo_db_unavailable", { reason: request.error?.name ?? "Unknown" });
        resolve(null);
      };
    } catch (error) {
      // Some private modes throw from open() itself.
      log.warn("grove.photo_db_unavailable", { reason: error instanceof Error ? error.name : "Unknown" });
      resolve(null);
    }
  });
  return opening;
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const request = work(db.transaction(STORE, mode).objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            log.warn("grove.photo_db_failed", { reason: request.error?.name ?? "Unknown" });
            resolve(null);
          };
        } catch (error) {
          log.warn("grove.photo_db_failed", { reason: error instanceof Error ? error.name : "Unknown" });
          resolve(null);
        }
      }),
  );
}

function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Chunked: String.fromCharCode with a spread overflows the stack on big arrays.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Saves an entry's photo (base64 JPEG), then drops the oldest beyond MAX_LOCAL_PHOTOS. Resolves true if saved. */
export async function savePhoto(id: string, base64: string): Promise<boolean> {
  let bytes: ArrayBuffer;
  try {
    bytes = base64ToBytes(base64);
  } catch {
    return false;
  }
  const record: PhotoRecord = { id, savedAt: Date.now(), bytes };
  const saved = await run("readwrite", (store) => store.put(record));
  if (saved === null) return false;
  const all = await run("readonly", (store) => store.getAll() as IDBRequest<PhotoRecord[]>);
  const evict = photosToEvict(all ?? [], MAX_LOCAL_PHOTOS);
  if (evict.length > 0) await deletePhotos(evict);
  return true;
}

/** The entry's photo as a JPEG Blob, or null. */
export async function readPhoto(id: string): Promise<Blob | null> {
  const record = await run("readonly", (store) => store.get(id) as IDBRequest<PhotoRecord | undefined>);
  return record ? new Blob([record.bytes], { type: "image/jpeg" }) : null;
}

/** The entry's photo as base64 JPEG with no prefix (for uploading), or null. */
export async function readPhotoBase64(id: string): Promise<string | null> {
  const record = await run("readonly", (store) => store.get(id) as IDBRequest<PhotoRecord | undefined>);
  return record ? bytesToBase64(record.bytes) : null;
}

/** Deletes these entries' photos. */
export async function deletePhotos(ids: readonly string[]): Promise<void> {
  for (const id of ids) await run("readwrite", (store) => store.delete(id));
}

/** Deletes every saved photo. */
export async function clearPhotos(): Promise<void> {
  await run("readwrite", (store) => store.clear());
}

/** Test-only: forget the open connection. */
export function resetPhotoCacheForTests(): void {
  opening = null;
}
