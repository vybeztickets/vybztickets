-- Fix: ensure all columns added after initial schema have proper defaults
-- so the handle_new_user trigger never fails on new signups.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS currency       TEXT,
  ADD COLUMN IF NOT EXISTS business_details JSONB;

-- Drop any accidental NOT NULL constraints and set safe defaults
ALTER TABLE public.profiles
  ALTER COLUMN currency       DROP NOT NULL,
  ALTER COLUMN currency       SET  DEFAULT 'USD',
  ALTER COLUMN business_details DROP NOT NULL;

-- Backfill any existing rows that have NULL currency
UPDATE public.profiles SET currency = 'USD' WHERE currency IS NULL;

-- Re-create the trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, currency)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'USD'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

NOTIFY pgrst, 'reload schema';
