-- Add fields to promo_links for proper discount code system
ALTER TABLE promo_links
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS max_uses INTEGER,
  ADD COLUMN IF NOT EXISTS times_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_guestlist BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast lookup by event
CREATE INDEX IF NOT EXISTS promo_links_event_idx ON promo_links(event_id);
CREATE INDEX IF NOT EXISTS promo_links_code_idx ON promo_links(code);
