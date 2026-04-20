-- KYC Verifications table
-- Run this in Supabase SQL Editor

create type kyc_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type payment_method as enum ('sinpe_movil', 'bank_transfer');

create table kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  status kyc_status not null default 'pending',
  full_name_on_id text not null,
  cedula_number text not null,
  cedula_front_url text,
  cedula_back_url text,
  selfie_url text,
  payment_method payment_method,
  sinpe_phone text,
  bank_name text,
  bank_account_iban text,
  rejection_reason text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- RLS: users can only read their own record
alter table kyc_verifications enable row level security;

create policy "Users can read own kyc"
  on kyc_verifications for select
  using (auth.uid() = user_id);

-- Insert/update handled via service role key only (from API)
-- No insert/update policy for users = they go through the API

-- Admins can read all (add admin check)
create policy "Admins can read all kyc"
  on kyc_verifications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update kyc"
  on kyc_verifications for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Storage bucket (run separately in Supabase dashboard or via API)
-- Create a private bucket named "kyc-documents"
-- Only service role can upload; admins can create signed URLs for review

-- Index for admin queries
create index idx_kyc_status on kyc_verifications(status);
create index idx_kyc_user on kyc_verifications(user_id);
