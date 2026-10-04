# Supabase: the Grove backend

The Grove (every result a user logs, plus its photo) can live in Supabase so
it survives clearing the browser. It is optional: with no Supabase env vars
the app keeps the Grove on the device, exactly as before.

- **Identity:** Supabase anonymous sign-in. No email, no password; the session
  lives in cookies, set by `/api/grove` on a visitor's first request. An
  anonymous user can be upgraded to a real account later without schema changes.
- **Data:** `public.grove_entries`, one row per logged result. Row-level
  security lets a user read, insert and delete only their own rows. There is
  no update policy: entries are written once.
- **Photos:** the private `grove-photos` bucket, one JPEG thumbnail per entry
  at `{user_id}/{entry_id}.jpg`. Storage RLS limits each user to their own
  folder. The app only ever hands out short-lived signed URLs.
- **Retention:** entries and photos are kept until the user removes the
  entry from its result card ("Remove", which deletes the row and its photo).
  Nothing expires on its own.
- **Keys:** only the project URL and anon key are used. The service-role key
  bypasses RLS and is never needed; don't add it.

Everything is in [`migrations/`](./migrations).

## Local development

Needs Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
cd fixie
supabase start          # Postgres, Auth and Storage in Docker; applies migrations/
supabase status         # prints the API URL and anon key
```

Put those two values in `fixie/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
```

Then `pnpm dev`. Anonymous sign-ins are already on in `config.toml`.

`supabase db reset` re-applies the migrations to a fresh local database.

## A hosted project

1. Create a project at supabase.com.
2. **Authentication → Sign In / Providers → Anonymous sign-ins: on.** Without
   it, `/api/grove` answers 503 and the app keeps the Grove on the device.
3. Apply the schema, bucket and policies:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
   (Project → Settings → API in Supabase shows both), then redeploy: the
   client decides local vs remote at build time.

Consider turning on CAPTCHA for anonymous sign-ins in production; the app
also rate-limits `/api/grove` per IP (`GROVE_POLICY` in `lib/rate-limit.ts`).

## Moving an existing local Grove up

The first time a browser reaches a configured Supabase, it uploads its local
entries (and their locally cached photos) oldest first, keeping each entry's
id so a retry can't plant duplicates, then clears them from the device. If an
upload fails partway, the rest stay local and move up on the next visit.

## Checking the policies

The policies were checked against Postgres 16 with a stub of Supabase's
`auth` and `storage` schemas: user B could not read, insert as, or delete
user A's rows or photos, a caller with no session saw nothing, and no one
could update an entry. Re-check against a real project after any policy change:
sign in as two anonymous users and confirm each sees only their own Grove.
