ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS charges_tax boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_name text DEFAULT 'IVA',
  ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 13,
  ADD COLUMN IF NOT EXISTS tax_entity_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS tax_legal_name text,
  ADD COLUMN IF NOT EXISTS tax_id_number text,
  ADD COLUMN IF NOT EXISTS tax_address text,
  ADD COLUMN IF NOT EXISTS tax_postcode text,
  ADD COLUMN IF NOT EXISTS tax_country text DEFAULT 'Costa Rica',
  ADD COLUMN IF NOT EXISTS tax_province text,
  ADD COLUMN IF NOT EXISTS tax_city text;

NOTIFY pgrst, 'reload schema';
