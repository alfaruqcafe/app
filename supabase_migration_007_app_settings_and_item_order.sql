-- Migration 007: Betriebsmodus (Supabase-Tabelle) & Produkt-Reihenfolge
-- ---------------------------------------------------------------------------
-- NOCH NICHT ANGEWENDET. Diese Migration kann nur im Supabase SQL Editor
-- (Dashboard-Zugang nötig) ausgeführt werden, da es sich um DDL handelt
-- (CREATE TABLE / ALTER TABLE) — das geht nicht über den anon-/service-Key
-- per REST-API.
--
-- Bis diese Migration läuft, funktionieren zwei Features nur lokal
-- (localStorage) statt geräteübergreifend über Supabase:
--   1. Der Betriebsmodus (Standard/Abholmodus/Nur-Speisekarte) — siehe
--      src/contexts/AppModeContext.jsx
--   2. Die Reihenfolge der Produkte INNERHALB einer Kategorie — siehe
--      src/contexts/MenuContext.jsx (ITEM_ORDER_KEY)
-- Die Kategorien-Reihenfolge und -Umbenennung funktionieren bereits JETZT
-- direkt über Supabase (categories.sort_order/.name existieren schon).

-- 1) Tabelle für den Betriebsmodus (Single-Row-Konfiguration)
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  order_mode VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard' | 'pickup' | 'menu_only'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (id, order_mode)
SELECT 1, 'standard'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update app_settings" ON app_settings;
CREATE POLICY "Admin update app_settings" ON app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 2) Spalte für die Produkt-Reihenfolge innerhalb einer Kategorie
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ---------------------------------------------------------------------------
-- NACH dem Ausführen dieser Migration (Code-Anpassung nötig, damit die Werte
-- tatsächlich aus Supabase statt localStorage kommen):
--   - AppModeContext.jsx: fetchMode()/setOrderMode() auf `supabase.from('app_settings')`
--     umstellen (inkl. Realtime-Subscription wie in MenuContext.jsx), statt
--     localStorage zu lesen/schreiben.
--   - MenuContext.jsx: beim Fetch von menu_items `.order('sort_order')` ergänzen,
--     und reorderItems() auf echte `UPDATE menu_items SET sort_order = ...`
--     Aufrufe umstellen statt der ITEM_ORDER_KEY-localStorage-Overrides.
