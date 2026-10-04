import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * A small in-memory stand-in for the parts of the Supabase client the Grove
 * uses, so tests never touch the network. It is one user's view: like RLS,
 * it only returns rows whose user_id matches the signed-in user.
 */

export interface FakeRow {
  id: string;
  user_id: string;
  scanned_at: string;
  logged_at: string;
  result: unknown;
  item: string;
  fairy: string;
  recyclable: string | null;
  photo_path: string | null;
}

export interface FakeSupabase {
  client: SupabaseClient;
  rows: FakeRow[];
  objects: Map<string, Uint8Array>;
  /** The signed-in user, or null before anonymous sign-in. */
  user: { id: string } | null;
  failures: { insert?: string; select?: string; upload?: boolean; signIn?: boolean };
  calls: { signIn: number; uploads: string[]; removed: string[] };
}

type Filters = Record<string, unknown>;

export function createFakeSupabase(initial: Partial<Pick<FakeSupabase, "rows" | "user">> = {}): FakeSupabase {
  const fake: FakeSupabase = {
    client: null as unknown as SupabaseClient,
    rows: initial.rows ?? [],
    objects: new Map(),
    user: initial.user === undefined ? { id: "user-a" } : initial.user,
    failures: {},
    calls: { signIn: 0, uploads: [], removed: [] },
  };

  const visible = (): FakeRow[] => fake.rows.filter((row) => row.user_id === fake.user?.id);
  const pick = (row: FakeRow, columns: string): Record<string, unknown> =>
    Object.fromEntries(columns.split(",").map((c) => [c.trim(), row[c.trim() as keyof FakeRow]]));

  function query(): unknown {
    let kind: "select" | "insert" | "delete" = "select";
    let columns = "*";
    let toInsert: Record<string, unknown> | null = null;
    const filters: Filters = {};
    let order: { column: keyof FakeRow; ascending: boolean } | null = null;
    let limit = Infinity;
    let single: "one" | "maybe" | null = null;

    function run(): { data: unknown; error: { code: string } | null } {
      const matches = (row: FakeRow): boolean =>
        Object.entries(filters).every(([key, value]) => row[key as keyof FakeRow] === value);
      if (kind === "insert") {
        if (fake.failures.insert) return { data: null, error: { code: fake.failures.insert } };
        const row = { logged_at: new Date().toISOString(), ...toInsert } as FakeRow;
        if (row.user_id !== fake.user?.id) return { data: null, error: { code: "42501" } };
        if (fake.rows.some((existing) => existing.id === row.id)) return { data: null, error: { code: "23505" } };
        fake.rows.push(row);
        return { data: pick(row, columns), error: null };
      }
      if (kind === "delete") {
        const doomed = visible().filter(matches);
        fake.rows = fake.rows.filter((row) => !doomed.includes(row));
        return { data: doomed.map((row) => pick(row, columns)), error: null };
      }
      if (fake.failures.select) return { data: null, error: { code: fake.failures.select } };
      let found = visible().filter(matches);
      if (order) {
        const { column, ascending } = order;
        found = [...found].sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1));
      }
      const data = found.slice(0, limit).map((row) => pick(row, columns));
      if (single) return { data: data[0] ?? null, error: null };
      return { data, error: null };
    }

    const builder = {
      select(cols = "*") {
        columns = cols;
        return builder;
      },
      insert(row: Record<string, unknown>) {
        kind = "insert";
        toInsert = row;
        return builder;
      },
      delete() {
        kind = "delete";
        return builder;
      },
      eq(column: string, value: unknown) {
        filters[column] = value;
        return builder;
      },
      order(column: keyof FakeRow, { ascending }: { ascending: boolean }) {
        order = { column, ascending };
        return builder;
      },
      limit(n: number) {
        limit = n;
        return builder;
      },
      single() {
        single = "one";
        return builder;
      },
      maybeSingle() {
        single = "maybe";
        return builder;
      },
      then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
        return Promise.resolve().then(run).then(resolve, reject);
      },
    };
    return builder;
  }

  const ownsPath = (path: string): boolean => path.split("/")[0] === fake.user?.id;

  const storage = {
    from: () => ({
      async upload(path: string, bytes: Uint8Array) {
        fake.calls.uploads.push(path);
        if (fake.failures.upload || !ownsPath(path) || fake.objects.has(path)) {
          return { data: null, error: { name: "StorageApiError" } };
        }
        fake.objects.set(path, bytes);
        return { data: { path }, error: null };
      },
      async createSignedUrls(paths: string[]) {
        return {
          data: paths.map((path) => ({
            path,
            error: null,
            signedURL: null,
            signedUrl: ownsPath(path) && fake.objects.has(path) ? `https://fake.supabase.co/sign/${path}?token=t` : null,
          })),
          error: null,
        };
      },
      async remove(paths: string[]) {
        for (const path of paths) {
          fake.calls.removed.push(path);
          if (ownsPath(path)) fake.objects.delete(path);
        }
        return { data: [], error: null };
      },
    }),
  };

  const auth = {
    async getUser() {
      return { data: { user: fake.user }, error: null };
    },
    async signInAnonymously() {
      fake.calls.signIn += 1;
      if (fake.failures.signIn) return { data: { user: null, session: null }, error: { code: "anonymous_provider_disabled" } };
      fake.user = { id: `anon-${fake.calls.signIn}` };
      return { data: { user: fake.user, session: {} }, error: null };
    },
  };

  fake.client = { from: () => query(), storage, auth } as unknown as SupabaseClient;
  return fake;
}

/** A tiny but real JPEG header followed by filler bytes, as base64. */
export const JPEG_BASE64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]).toString("base64");
