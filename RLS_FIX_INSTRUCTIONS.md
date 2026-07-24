# RLS-Fehler Fix für Abholmodus — Anleitung

## Problem
**Fehlermeldung:** `"Fehler bei der Bestellung: new row violates row-level security policy for table 'orders'"`

Dies tritt auf, wenn Sie den Modus auf "Abholmodus" (pickup) wechseln und versuchen, eine Bestellung aufzugeben.

## Ursache
Die Supabase Row-Level Security (RLS) Policy in der Datenbank ist zu restriktiv. Die Policies aus Migration 004 sind möglicherweise noch aktiv und blockieren Bestellungen.

## Lösung

### Schritt 1: SQL-Migration ausführen

1. Öffnen Sie [Supabase Dashboard](https://supabase.com/dashboard)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie auf **SQL Editor** (linke Seitenleiste)
4. Klicken Sie auf **New query**
5. Kopieren Sie den gesamten Inhalt aus dieser Datei:
   ```
   supabase_migration_008_fix_rls_for_orders.sql
   ```
6. Fügen Sie ihn in den SQL Editor ein
7. Klicken Sie auf **Run** oder drücken Sie `Cmd+Enter`

### Schritt 2: Fehlerkontrolle

Nach dem Ausführen sollte die Abfrage erfolgreich abgeschlossen sein (grünes Häkchen).

Falls Fehler auftreten:
- **`ERROR: policy "Insert orders policy" for table "orders" already exists`** 
  → Das ist in Ordnung! Es bedeutet, die Policy war noch aktiv. Die neue Version würde sie überschreiben.
- **Andere Fehler:** Bitte Screenshot mit Fehlermeldung posten

### Schritt 3: App neuladen

1. Gehen Sie zurück zu Ihrer App
2. Laden Sie die Seite neu (`Cmd+R` oder `Ctrl+F5`)
3. Probieren Sie erneut:
   - Admin Dashboard öffnen
   - Modus auf "Abholmodus" setzen
   - Ein Produkt auswählen
   - Bestellung aufgeben

## Was wurde behoben

Die neue Migration 008 ersetzt die alten, restriktiven RLS-Policies durch:

- ✅ Einfügungen mit `customer_id = auth.uid()` (eigene Bestellungen)
- ✅ Einfügungen mit `customer_id IS NULL` (Gastbestellungen)
- ✅ Explizite `auth.uid() IS NOT NULL` Checks
- ✅ Konsistente Regeln für `orders` UND `order_items`
- ✅ Unterstützung für Tischnummer `0` (Pickup-Modus)

## Weitere Änderungen

Im Code habe ich auch folgendes verbessert:

**OrdersContext.jsx:**
- Besseres Error-Logging für Debugging
- Validierung, dass `customer_id` nicht NULL sein kann
- Fallback zu `user.id` falls nicht bereitgestellt

Diese Änderungen sind bereits im Repo committed.

## Wenn es immer noch nicht funktioniert

Prüfen Sie folgende Fehlermöglichkeiten:

1. **Migration 008 wurde nicht ausgeführt** → Siehe Schritt 1
2. **Alte Policies sind noch im Weg** → Führen Sie das komplette DROP-Skript manuell aus
3. **Browser Cache** → Seite mit `Cmd+Shift+R` (Hard Refresh) neuladen
4. **Benutzer nicht angemeldet** → Bei Logout/Login erneut anmelden
5. **Supabase Connection falsch** → Prüfen Sie `.env.local` oder `.env` auf korrekte `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`

## Technische Details (Falls interessant)

Die RLS Policy definiert, wer was mit Tabellen darf:

```sql
-- INSERT erlaubt wenn: Benutzer ist angemeldet UND
-- (customer_id ist meine ID ODER customer_id ist NULL)
CREATE POLICY "Insert orders policy" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      customer_id = auth.uid()
      OR customer_id IS NULL
    )
  );
```

Dies erlaubt:
- Anonyme Nutzer (bekommen eine UUID) → ihre eigenen Bestellungen
- Gast-Bestellungen → mit NULL customer_id
- Staff → kann bei Bedarf beide Typen einfügen
