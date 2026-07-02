-- Migration 004: Absicherung der Bestellungen via Row Level Security (RLS)
-- Stellt sicher, dass Kunden nur ihre eigenen Bestellungen sehen, während Mitarbeiter alle Bestellungen sehen/verwalten können.

-- 1. RLS für Tabellen aktivieren
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Alte Policies entfernen, um Konflikte zu vermeiden
DROP POLICY IF EXISTS "Customers read own orders" ON orders;
DROP POLICY IF EXISTS "Staff read all orders" ON orders;
DROP POLICY IF EXISTS "Staff/Admin/Cashier read all orders" ON orders;
DROP POLICY IF EXISTS "Insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff/Admin/Cashier update orders" ON orders;

DROP POLICY IF EXISTS "Public insert order_items" ON order_items;
DROP POLICY IF EXISTS "Read order_items of own or staff orders" ON order_items;
DROP POLICY IF EXISTS "Read order_items of own or staff/admin/cashier orders" ON order_items;
DROP POLICY IF EXISTS "Staff/Admin/Cashier update order_items" ON order_items;

-- 3. Neue Policies für 'orders' erstellen
-- SELECT: Kunden sehen nur eigene Bestellungen. Mitarbeiter (staff, admin, cashier) sehen alle.
CREATE POLICY "Select orders policy" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('staff', 'admin', 'cashier')
    )
  );

-- INSERT: Jeder angemeldete (auch anonyme) Account darf seine eigenen Bestellungen anlegen
CREATE POLICY "Insert orders policy" ON orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
  );

-- UPDATE: Nur Mitarbeiter dürfen Bestellungen aktualisieren (z. B. Statusänderungen oder Bezahlstatus)
CREATE POLICY "Update orders policy" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('staff', 'admin', 'cashier')
    )
  );

-- 4. Neue Policies für 'order_items' erstellen
-- SELECT: Kunden sehen nur Positionen ihrer eigenen Bestellungen. Mitarbeiter sehen alle.
CREATE POLICY "Select order_items policy" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('staff', 'admin', 'cashier')
        )
      )
    )
  );

-- INSERT: Positionen dürfen für die eigene Bestellung angelegt werden
CREATE POLICY "Insert order_items policy" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_id = auth.uid()
        OR auth.uid() IS NULL
      )
    )
  );

-- UPDATE: Nur Mitarbeiter dürfen Positionen aktualisieren (z. B. Bezahlstatus an der Kasse)
CREATE POLICY "Update order_items policy" ON order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'admin', 'cashier')
      )
    )
  );
