-- The Grove: one row per result a user logs, plus a private photo bucket.
-- Every user is an anonymous Supabase user (no email, no password). Row-level
-- security is the only thing that separates one user's Grove from another's,
-- so every policy below is scoped to auth.uid().

create table public.grove_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  scanned_at timestamptz not null,
  logged_at timestamptz not null default now(),
  result jsonb not null,            -- a ScanResult, validated with Zod before insert and after select
  item text not null,               -- denormalised for listing
  fairy text not null,
  recyclable text,
  photo_path text                   -- storage object path, null if no photo
);

-- The Grove lists one user's entries in logging order.
create index grove_entries_user_logged_at on public.grove_entries (user_id, logged_at);

alter table public.grove_entries enable row level security;

create policy "Users read their own Grove"
  on public.grove_entries for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users log to their own Grove"
  on public.grove_entries for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users remove from their own Grove"
  on public.grove_entries for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- No update policy: entries are written once and never edited.

-- Photos: private bucket, JPEG thumbnails only, objects at {user_id}/{entry_id}.jpg.
-- Read through short-lived signed URLs, never public URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grove-photos', 'grove-photos', false, 262144, array['image/jpeg'])
on conflict (id) do nothing;

create policy "Users read their own Grove photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'grove-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own Grove photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'grove-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own Grove photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'grove-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
