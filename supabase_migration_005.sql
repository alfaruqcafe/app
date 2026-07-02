-- Migration 005: RLS-Korrektur für anonyme/Gast-Bestellungen und Personal
-- Ermöglicht Bestellungen ohne festen Kunden-Account (z. B. wenn anonyme Anmeldung deaktiviert ist oder das Personal eine Bestellung aufnimmt).

-- 1. Bestehende Policies entfernen, um Konflikte zu vermeiden
DROP POLICY IF EXISTS "Insert orders policy" ON orders;
DROP POLICY IF EXISTS "Insert order_items policy" ON order_items;

-- 2. Neue INSERT-Policy für 'orders' erstellen
-- Erlaubt das Einfügen, wenn die Bestellung dem aktuellen Account zugeordnet ist ODER wenn es eine Gastbestellung ist (customer_id ist NULL).
CREATE POLICY "Insert orders policy" ON orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    OR customer_id IS NULL
  );

-- 3. Neue INSERT-Policy für 'order_items' erstellen
-- Erlaubt das Einfügen von Bestellpositionen, wenn die Bestellung dem aktuellen Account gehört, es eine Gastbestellung ist (customer_id ist NULL), oder das Personal sie einfügt.
CREATE POLICY "Insert order_items policy" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_id = auth.uid()
        OR o.customer_id IS NULL
        OR EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('staff', 'admin', 'cashier')
        )
      )
    )
  );
