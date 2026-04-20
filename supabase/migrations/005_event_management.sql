-- Event extra fields
alter table public.events
  add column if not exists instagram_url text,
  add column if not exists end_time text,
  add column if not exists pre_purchase_message text,
  add column if not exists post_purchase_message text,
  add column if not exists terms_conditions text,
  add column if not exists collect_id boolean default false,
  add column if not exists facebook_pixel text,
  add column if not exists google_analytics text,
  add column if not exists google_tag_manager text,
  add column if not exists banner_url text,
  add column if not exists location_lat float,
  add column if not exists location_lng float,
  add column if not exists location_secret boolean default false,
  add column if not exists is_visible boolean default true,
  add column if not exists ticket_border_color text default '#7c3aed',
  add column if not exists ticket_text_color text default '#ffffff',
  add column if not exists ticket_bg_color text default '#0a0a0a',
  add column if not exists ticket_accent_color text default '#db2777';

-- Ticket type extra fields
alter table public.ticket_types
  add column if not exists is_hidden boolean default false,
  add column if not exists min_per_order int default 1,
  add column if not exists max_per_order int,
  add column if not exists sales_start_date timestamptz,
  add column if not exists sales_end_date timestamptz,
  add column if not exists entry_deadline timestamptz;
