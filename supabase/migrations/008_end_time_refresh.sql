-- Ensure end_time column exists (safe re-run)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time text;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
