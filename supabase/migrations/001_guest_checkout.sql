-- ============================================================
-- MIGRACIÓN 001: Soporte para checkout como invitado
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. attendee_id ahora es opcional (invitados no tienen cuenta)
alter table public.tickets
  alter column attendee_id drop not null;

-- 2. Agregar datos del comprador directamente en el ticket
alter table public.tickets
  add column if not exists buyer_email text,
  add column if not exists buyer_name  text;

-- 3. Todo ticket necesita email del comprador
--    (sea usuario registrado o invitado)
alter table public.tickets
  add constraint tickets_buyer_email_required
  check (buyer_email is not null);

-- 4. Índice para buscar tickets por email (ej: "mis tickets")
create index if not exists idx_tickets_buyer_email
  on public.tickets(buyer_email);

-- 5. Política: invitados pueden comprar tickets (insert público)
drop policy if exists "Asistentes compran tickets" on public.tickets;

create policy "Cualquiera puede comprar tickets"
  on public.tickets for insert
  with check (true);

-- 6. Política: buscar tickets por email (para "mis tickets" sin cuenta)
create policy "Ver tickets por email"
  on public.tickets for select
  using (
    buyer_email = current_setting('request.jwt.claims', true)::json->>'email'
    or auth.uid() = attendee_id
    or auth.uid() = (select organizer_id from public.events where id = event_id)
  );

-- Eliminar política anterior de select que ya no aplica sola
drop policy if exists "Asistentes ven sus propios tickets" on public.tickets;
drop policy if exists "Organizadores ven tickets de sus eventos" on public.tickets;
