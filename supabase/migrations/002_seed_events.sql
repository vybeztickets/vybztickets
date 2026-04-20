-- ============================================================
-- SEED: Eventos de prueba para Costa Rica
-- Organizer UUID: 0c027a85-59a3-4602-b6c6-12f6c0a0d933
-- ============================================================

-- Insertar perfil del organizador
insert into public.profiles (id, full_name, email, role)
values (
  '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
  'Vybz Admin',
  'admin@vybztickets.com',
  'organizer'
) on conflict (id) do nothing;

-- Insertar eventos
insert into public.events (id, organizer_id, name, description, date, time, venue, city, country, category, image_url, status)
values
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'Ultra Costa Rica 2025',
    'El festival de música electrónica más grande de Centroamérica regresa a San José. Headliners internacionales, múltiples escenarios y una experiencia única.',
    '2025-08-15',
    '18:00',
    'La Sabana Metropolitan Park',
    'San José',
    'Costa Rica',
    'Festival',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    'published'
  ),
  (
    'a1b2c3d4-0002-0000-0000-000000000002',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'Reggaeton en la Playa',
    'La fiesta más caliente del Pacífico. DJs y artistas top del reggaeton en Jacó Beach con vista al mar.',
    '2025-07-20',
    '20:00',
    'Jacó Beach Club',
    'Jacó',
    'Costa Rica',
    'Música',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    'published'
  ),
  (
    'a1b2c3d4-0003-0000-0000-000000000003',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'TechCR Summit 2025',
    'La conferencia de tecnología más importante de Costa Rica. Speakers de Silicon Valley, workshops y networking.',
    '2025-09-10',
    '09:00',
    'Centro de Convenciones Costa Rica',
    'San José',
    'Costa Rica',
    'Tecnología',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    'published'
  ),
  (
    'a1b2c3d4-0004-0000-0000-000000000004',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'Noche de Salsa & Merengue',
    'Una noche de baile y sabor latino en el corazón de Escazú. Orquesta en vivo y los mejores bailarines del país.',
    '2025-07-05',
    '21:00',
    'Sala Garbo',
    'Escazú',
    'Costa Rica',
    'Música',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'published'
  ),
  (
    'a1b2c3d4-0005-0000-0000-000000000005',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'Stand Up Comedy Night',
    'Los comediantes más divertidos de Costa Rica en una noche de risas garantizadas. Apta para mayores de 18.',
    '2025-07-12',
    '20:30',
    'Teatro Espressivo',
    'San José',
    'Costa Rica',
    'Entretenimiento',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80',
    'published'
  ),
  (
    'a1b2c3d4-0006-0000-0000-000000000006',
    '0c027a85-59a3-4602-b6c6-12f6c0a0d933',
    'Feria Gastronómica CR',
    'Más de 50 restaurantes y chefs de todo el país en el evento gastronómico del año. Maridajes, talleres y degustaciones.',
    '2025-08-02',
    '11:00',
    'Multiplaza Escazú',
    'Escazú',
    'Costa Rica',
    'Gastronomía',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'published'
  );

-- Insertar tipos de tickets para cada evento
insert into public.ticket_types (event_id, name, description, price, total_available)
values
  -- Ultra Costa Rica
  ('a1b2c3d4-0001-0000-0000-000000000001', 'General', 'Acceso general al festival', 45000, 2000),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'VIP', 'Área VIP con barra exclusiva y mejor vista', 95000, 300),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Early Bird', 'Precio especial por tiempo limitado', 32000, 200),

  -- Reggaeton en la Playa
  ('a1b2c3d4-0002-0000-0000-000000000002', 'General', 'Entrada general a la playa', 25000, 500),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'VIP', 'Mesa VIP con botella incluida', 120000, 50),

  -- TechCR Summit
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Conferencia', 'Acceso a todas las charlas', 35000, 800),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Workshop Pass', 'Conferencia + workshops exclusivos', 75000, 150),

  -- Salsa & Merengue
  ('a1b2c3d4-0004-0000-0000-000000000004', 'General', 'Entrada general + una consumición', 15000, 300),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Mesa VIP', 'Mesa para 4 personas con botella', 85000, 20),

  -- Stand Up Comedy
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Platea', 'Asiento numerado en platea', 12000, 200),
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Palco', 'Asiento preferencial en palco', 18000, 80),

  -- Feria Gastronómica
  ('a1b2c3d4-0006-0000-0000-000000000006', 'Entrada', 'Acceso al recinto + 3 fichas de degustación', 8000, 1000),
  ('a1b2c3d4-0006-0000-0000-000000000006', 'Gourmet Pass', 'Acceso + 10 fichas + taller de cocina', 22000, 100);
