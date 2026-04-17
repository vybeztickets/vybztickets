-- ============================================================
-- VYBZ TICKETS — Schema completo
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null default 'attendee'
                check (role in ('attendee', 'organizer', 'staff', 'admin')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Events ───────────────────────────────────────────────
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  date            date not null,
  time            time not null,
  venue           text not null,
  city            text not null,
  country         text not null default 'Costa Rica',
  category        text not null,
  image_url       text,
  status          text not null default 'draft'
                    check (status in ('draft', 'published', 'cancelled', 'completed')),
  sales_end_date  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-actualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ─── Ticket Types ─────────────────────────────────────────
create table if not exists public.ticket_types (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  name             text not null,
  description      text,
  price            integer not null check (price >= 0),  -- en colones
  total_available  integer not null check (total_available > 0),
  sold_count       integer not null default 0 check (sold_count >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ─── Tickets ──────────────────────────────────────────────
create table if not exists public.tickets (
  id               uuid primary key default gen_random_uuid(),
  ticket_type_id   uuid not null references public.ticket_types(id) on delete restrict,
  event_id         uuid not null references public.events(id) on delete restrict,
  attendee_id      uuid not null references auth.users(id) on delete restrict,
  status           text not null default 'active'
                     check (status in ('active', 'used', 'cancelled', 'refunded')),
  purchase_price   integer not null,
  qr_code          text not null unique default gen_random_uuid()::text,
  created_at       timestamptz not null default now()
);

-- Incrementar sold_count al comprar
create or replace function public.increment_sold_count()
returns trigger language plpgsql security definer as $$
begin
  update public.ticket_types
  set sold_count = sold_count + 1
  where id = new.ticket_type_id
    and (sold_count + 1) <= total_available;

  if not found then
    raise exception 'No hay entradas disponibles para este tipo de ticket';
  end if;

  return new;
end;
$$;

drop trigger if exists on_ticket_purchased on public.tickets;
create trigger on_ticket_purchased
  after insert on public.tickets
  for each row execute procedure public.increment_sold_count();

-- ─── Ticket Validations ───────────────────────────────────
create table if not exists public.ticket_validations (
  id                 uuid primary key default gen_random_uuid(),
  ticket_id          uuid not null references public.tickets(id) on delete restrict,
  event_id           uuid not null references public.events(id) on delete restrict,
  validated_by       uuid references auth.users(id),
  validation_time    timestamptz not null default now(),
  validation_method  text not null default 'qr_scan'
                       check (validation_method in ('qr_scan', 'manual')),
  status             text not null
                       check (status in ('valid', 'invalid', 'already_used'))
);

-- ─── Resale Listings ──────────────────────────────────────
create table if not exists public.resale_listings (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets(id) on delete cascade,
  seller_id       uuid not null references auth.users(id) on delete cascade,
  original_price  integer not null,
  resale_price    integer not null check (resale_price > 0),
  status          text not null default 'active'
                    check (status in ('active', 'sold', 'cancelled')),
  escrow_status   text not null default 'pending'
                    check (escrow_status in ('pending', 'held', 'released', 'refunded')),
  created_at      timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────
create index if not exists idx_events_status        on public.events(status);
create index if not exists idx_events_date          on public.events(date);
create index if not exists idx_events_organizer     on public.events(organizer_id);
create index if not exists idx_events_category      on public.events(category);
create index if not exists idx_ticket_types_event   on public.ticket_types(event_id);
create index if not exists idx_tickets_attendee     on public.tickets(attendee_id);
create index if not exists idx_tickets_event        on public.tickets(event_id);
create index if not exists idx_tickets_qr           on public.tickets(qr_code);
create index if not exists idx_validations_event    on public.ticket_validations(event_id);
create index if not exists idx_resale_status        on public.resale_listings(status);

-- ─── Row Level Security ───────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.events            enable row level security;
alter table public.ticket_types      enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_validations enable row level security;
alter table public.resale_listings   enable row level security;

-- Profiles
create policy "Usuarios ven su propio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Usuarios actualizan su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Events: lectura pública de eventos publicados
create policy "Eventos publicados son públicos"
  on public.events for select
  using (status = 'published' or auth.uid() = organizer_id);
create policy "Organizadores crean eventos"
  on public.events for insert
  with check (auth.uid() = organizer_id);
create policy "Organizadores editan sus eventos"
  on public.events for update
  using (auth.uid() = organizer_id);
create policy "Organizadores eliminan sus eventos"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- Ticket Types: lectura pública
create policy "Ticket types son públicos"
  on public.ticket_types for select using (true);
create policy "Organizadores gestionan ticket types"
  on public.ticket_types for all
  using (
    auth.uid() = (select organizer_id from public.events where id = event_id)
  );

-- Tickets
create policy "Asistentes ven sus propios tickets"
  on public.tickets for select
  using (auth.uid() = attendee_id);
create policy "Organizadores ven tickets de sus eventos"
  on public.tickets for select
  using (
    auth.uid() = (select organizer_id from public.events where id = event_id)
  );
create policy "Asistentes compran tickets"
  on public.tickets for insert
  with check (auth.uid() = attendee_id);

-- Validations
create policy "Staff y organizadores validan tickets"
  on public.ticket_validations for insert
  with check (auth.uid() = validated_by);
create policy "Organizadores ven validaciones de sus eventos"
  on public.ticket_validations for select
  using (
    auth.uid() = (select organizer_id from public.events where id = event_id)
  );

-- Resale
create policy "Listings activos son públicos"
  on public.resale_listings for select
  using (status = 'active' or auth.uid() = seller_id);
create policy "Vendedores crean listings"
  on public.resale_listings for insert
  with check (auth.uid() = seller_id);
create policy "Vendedores gestionan sus listings"
  on public.resale_listings for update
  using (auth.uid() = seller_id);

-- ─── Seed data (eventos de prueba) ────────────────────────
-- Nota: requiere un usuario organizer_id válido.
-- Después del primer registro puedes correr esto con tu user ID:
/*
insert into public.events (organizer_id, name, description, date, time, venue, city, category, image_url, status) values
  ('<TU_USER_ID>', 'Ultra Music Festival CR', 'El festival de electrónica más grande de Costa Rica.', '2025-06-15', '18:00', 'Parque La Sabana', 'San José', 'Electronic', 'https://images.unsplash.com/photo-1540039723070-438d9dfdeab2', 'published'),
  ('<TU_USER_ID>', 'Jazz & Chill Rooftop', 'Una noche de jazz bajo las estrellas.', '2025-07-05', '20:00', 'Rooftop 503', 'Escazú', 'Jazz', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f', 'published');
*/
