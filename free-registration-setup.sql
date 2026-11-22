-- MFM Hilltop Media Training 2026: FREE REGISTRATION SETUP
-- Run this in Supabase SQL Editor. It keeps existing participant rows and legacy payment columns.

create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text unique,
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
  payment_status text not null default 'not_required',
  registration_status text not null default 'approved',
  created_at timestamptz not null default now()
);

-- Add any columns missing from an earlier version without deleting existing data.
alter table public.registrations add column if not exists registration_code text;
alter table public.registrations add column if not exists assembly text;
alter table public.registrations add column if not exists second_choice text;
alter table public.registrations add column if not exists experience text;
alter table public.registrations add column if not exists payment_reference text;
alter table public.registrations add column if not exists receipt_path text;
alter table public.registrations add column if not exists payment_status text default 'not_required';
alter table public.registrations add column if not exists registration_status text default 'approved';
alter table public.registrations add column if not exists created_at timestamptz default now();
alter table public.registrations alter column id set default gen_random_uuid();

-- Legacy payment status is retained only for compatibility; new free registrations use not_required.
alter table public.registrations drop constraint if exists registrations_payment_status_check;
alter table public.registrations add constraint registrations_payment_status_check
  check (payment_status in ('pending','verified','rejected','not_required'));
alter table public.registrations drop constraint if exists registrations_registration_status_check;
alter table public.registrations add constraint registrations_registration_status_check
  check (registration_status in ('pending','approved','rejected'));

create or replace function public.set_registration_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id is null then new.id := gen_random_uuid(); end if;
  if new.registration_code is null or btrim(new.registration_code) = '' then
    new.registration_code := 'MFM26-' || upper(left(replace(new.id::text, '-', ''), 8));
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_set_code on public.registrations;
create trigger registrations_set_code before insert on public.registrations
for each row execute function public.set_registration_code();

-- Backfill registration codes for any older rows that do not yet have one.
update public.registrations
set registration_code = 'MFM26-' || upper(left(replace(id::text, '-', ''), 8))
where registration_code is null or btrim(registration_code) = '';

alter table public.registrations alter column registration_code set not null;

-- Public form uses this function, not direct table SELECT/INSERT permissions.
create or replace function public.register_participant(
  p_full_name text, p_phone text, p_email text, p_church_branch text,
  p_assembly text, p_first_choice text, p_second_choice text, p_experience text
) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if nullif(btrim(p_full_name), '') is null
     or nullif(btrim(p_phone), '') is null
     or nullif(btrim(p_email), '') is null
     or nullif(btrim(p_church_branch), '') is null
     or nullif(btrim(p_first_choice), '') is null then
    raise exception 'Please complete all required registration fields.';
  end if;

  insert into public.registrations (
    full_name, phone, email, church_branch, assembly, first_choice,
    second_choice, experience, payment_status, registration_status,
    payment_reference, receipt_path
  ) values (
    btrim(p_full_name), btrim(p_phone), lower(btrim(p_email)), btrim(p_church_branch),
    nullif(btrim(coalesce(p_assembly, '')), ''), btrim(p_first_choice),
    nullif(btrim(coalesce(p_second_choice, '')), ''),
    nullif(btrim(coalesce(p_experience, '')), ''), 'not_required', 'approved', null, null
  ) returning registration_code into v_code;

  return v_code;
end;
$$;

revoke all on function public.register_participant(text,text,text,text,text,text,text,text) from public;
grant execute on function public.register_participant(text,text,text,text,text,text,text,text) to anon, authenticated;

-- Admin allow-list. Add only the organiser's Supabase Auth user UUID here.
create table if not exists public.training_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.training_admins enable row level security;

create or replace function public.is_training_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.training_admins where user_id = auth.uid());
$$;
revoke all on function public.is_training_admin() from public;
grant execute on function public.is_training_admin() to authenticated;

alter table public.registrations enable row level security;
drop policy if exists "Anyone can submit registration" on public.registrations;
drop policy if exists "Admins can read registrations" on public.registrations;
drop policy if exists "Admins can update registrations" on public.registrations;

create policy "Admins can read registrations" on public.registrations
for select to authenticated using (public.is_training_admin());
create policy "Admins can update registration status" on public.registrations
for update to authenticated using (public.is_training_admin())
with check (public.is_training_admin());

revoke all on public.registrations from anon;
grant select on public.registrations to authenticated;
grant update (registration_status) on public.registrations to authenticated;

-- After creating the organiser account in Supabase Authentication > Users,
-- copy its UUID and run this separately (replace the placeholder):
-- insert into public.training_admins (user_id) values ('PASTE-ADMIN-USER-UUID-HERE');
