-- Run this entire script in Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key,
  registration_code text unique not null,
  full_name text not null,
  phone text not null,
  email text not null,
  church_branch text not null,
  assembly text,
  first_choice text not null,
  second_choice text,
  experience text,
  payment_reference text,
  receipt_path text,
  payment_status text not null default 'pending' check (payment_status in ('pending','verified','rejected')),
  registration_status text not null default 'pending' check (registration_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

-- Public visitors may submit registrations, but cannot read the participant list.
drop policy if exists "Anyone can submit registration" on public.registrations;
create policy "Anyone can submit registration"
on public.registrations for insert to anon, authenticated
with check (
  payment_status = 'pending'
  and registration_status = 'pending'
);

-- Admin access is limited to authenticated accounts listed in this table.
create table if not exists public.training_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.training_admins enable row level security;

create or replace function public.is_training_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.training_admins where user_id = auth.uid());
$$;

drop policy if exists "Admins can read registrations" on public.registrations;
create policy "Admins can read registrations"
on public.registrations for select to authenticated
using (public.is_training_admin());

drop policy if exists "Admins can update registrations" on public.registrations;
create policy "Admins can update registrations"
on public.registrations for update to authenticated
using (public.is_training_admin())
with check (public.is_training_admin());

-- Private receipt bucket; maximum 5MB and accepted file types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','application/pdf'];

drop policy if exists "Applicants can upload receipts" on storage.objects;
create policy "Applicants can upload receipts"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'payment-receipts');

drop policy if exists "Admins can read receipts" on storage.objects;
create policy "Admins can read receipts"
on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and public.is_training_admin());
