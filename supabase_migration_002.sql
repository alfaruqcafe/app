-- Migration 002: Kundenidentität via anonyme Auth + Bestellhistorie
-- Voraussetzung (manueller Schritt im Supabase Dashboard):
--   Auth > Providers > Anonymous Sign-Ins aktivieren

-- Kunden-Zuordnung für Bestellungen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Alte permissive Policies ersetzen
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public read order_items" ON order_items;

-- Kunden sehen nur ihre eigenen Bestellungen
CREATE POLICY "Customers read own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Staff/Admin sehen alle Bestellungen
CREATE POLICY "Staff read all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin'))
  );

-- Bestellungen werden nur für den eigenen (auch anonymen) Account angelegt
CREATE POLICY "Insert own orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Bestellpositionen: sichtbar für Besteller selbst oder Staff/Admin
CREATE POLICY "Read order_items of own or staff orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND (
        o.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin'))
      )
    )
  );
