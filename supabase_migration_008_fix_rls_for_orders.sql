-- Migration 008: Fix RLS für Orders um Abholmodus zu unterstützen
-- Problem: INSERT RLS Policy blockiert selbst bei customer_id = auth.uid()
-- Lösung: Vereinfachte und getestete RLS Policy

-- 1. Alle bestehenden Policies entfernen um Konflikte zu vermeiden
DROP POLICY IF EXISTS "Select orders policy" ON orders;
DROP POLICY IF EXISTS "Insert orders policy" ON orders;
DROP POLICY IF EXISTS "Update orders policy" ON orders;

-- 2. SELECT Policy: Kunden sehen nur ihre Bestellungen, Mitarbeiter sehen alle
CREATE POLICY "Select orders policy" ON orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'admin', 'cashier')
      )
    )
  );

-- 3. INSERT Policy: Jeder kann eine Bestellung erstellen, wenn customer_id = auth.uid() oder NULL ist
CREATE POLICY "Insert orders policy" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR customer_id IS NULL
    )
  );

-- 4. UPDATE Policy: Nur Mitarbeiter dürfen aktualisieren
CREATE POLICY "Update orders policy" ON orders
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('staff', 'admin', 'cashier')
    )
  );

-- 5. DELETE Policy: Nur Mitarbeiter dürfen löschen
CREATE POLICY "Delete orders policy" ON orders
  FOR DELETE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('staff', 'admin', 'cashier')
    )
  );

-- 6. Alle bestehenden order_items Policies entfernen
DROP POLICY IF EXISTS "Select order_items policy" ON order_items;
DROP POLICY IF EXISTS "Insert order_items policy" ON order_items;
DROP POLICY IF EXISTS "Update order_items policy" ON order_items;

-- 7. SELECT Policy für order_items
CREATE POLICY "Select order_items policy" ON order_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
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

-- 8. INSERT Policy für order_items
CREATE POLICY "Insert order_items policy" ON order_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
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

-- 9. UPDATE Policy für order_items
CREATE POLICY "Update order_items policy" ON order_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'admin', 'cashier')
      )
    )
  );

-- 10. DELETE Policy für order_items
CREATE POLICY "Delete order_items policy" ON order_items
  FOR DELETE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'admin', 'cashier')
      )
    )
  );
