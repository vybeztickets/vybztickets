-- ============================================================
-- MIGRACIÓN 004: VIP Tables + mejoras al checkout
-- ============================================================

-- 1. Agregar campos a ticket_types para soportar mesas VIP
alter table public.ticket_types
  add column if not exists category text not null default 'general' check (category in ('general', 'table')),
  add column if not exists capacity int,           -- personas máx por mesa
  add column if not exists zone_name text,         -- ej: "VIP Zone", "Backstage"
  add column if not exists zone_color text,        -- ej: "#f59e0b", "#ef4444"
  add column if not exists map_position_x float,   -- posición en el mapa (0-100%)
  add column if not exists map_position_y float;

-- 2. Agregar mapa de venue a eventos
alter table public.events
  add column if not exists venue_map_url text,     -- URL de imagen del plano del venue
  add column if not exists has_tables boolean not null default false;

-- 3. Mejorar tickets con más info del comprador
alter table public.tickets
  add column if not exists buyer_phone text,
  add column if not exists buyer_notes text,
  add column if not exists pax_count int default 1,  -- personas en la mesa
  add column if not exists promo_code text,
  add column if not exists marketing_opt_in boolean default false;

-- 4. Tabla de promotores y sus links de venta
create table if not exists public.promo_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  organizer_id uuid references auth.users(id),
  promoter_name text not null,
  code text not null unique,
  discount_percent int default 0,
  tickets_sold int default 0,
  created_at timestamptz default now()
);

alter table public.promo_links enable row level security;

create policy "Organizadores gestionan sus promo links"
  on public.promo_links for all
  using (organizer_id = auth.uid());

-- 5. Índice para promo codes
create index if not exists idx_promo_links_code on public.promo_links(code);
