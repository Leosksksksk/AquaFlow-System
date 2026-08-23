-- ============================================
-- AquaFlow — Supabase Setup
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Main table: fault line reports
create table if not exists fault_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  title text not null,
  description text not null,
  location text,
  photo_url text,
  status text not null default 'Pending' check (status in ('Pending', 'Assigned', 'In Progress', 'Resolved')),
  reporter_name text not null,
  assigned_technician text,
  admin_response text,
  broadcast_message text,
  escalated boolean default false,
  responded_at timestamp with time zone,
  resolved_at timestamp with time zone
);

-- Enable Row Level Security
alter table fault_reports enable row level security;

-- Public policies (no auth required)
drop policy if exists "Public can read reports" on fault_reports;
create policy "Public can read reports"
  on fault_reports for select
  using (true);

drop policy if exists "Public can insert reports" on fault_reports;
create policy "Public can insert reports"
  on fault_reports for insert
  with check (true);

drop policy if exists "Public can update reports" on fault_reports;
create policy "Public can update reports"
  on fault_reports for update
  using (true);

drop policy if exists "Public can delete reports" on fault_reports;
create policy "Public can delete reports"
  on fault_reports for delete
  using (true);

-- Storage bucket for report photos
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to report photos" on storage.objects;
create policy "Public read access to report photos"
  on storage.objects for select
  using (bucket_id = 'report-photos');

drop policy if exists "Public upload access to report photos" on storage.objects;
create policy "Public upload access to report photos"
  on storage.objects for insert
  with check (bucket_id = 'report-photos');
