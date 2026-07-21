-- Migration 006: Options-Pools für das neue Produktdetail-/Options-System
-- ---------------------------------------------------------------------------
-- HINWEIS: Diese Daten wurden bereits per API in die Datenbank eingetragen
-- (Kategorien 'Toppings' = id 10, 'Getränke-Extras' = id 11). Diese Datei dient
-- als Dokumentation / zum erneuten Anwenden. Idempotent (mehrfaches Ausführen ok).
--
-- Die Waffel-Menüs existieren bereits in der Kategorie "Menüs":
--   "2x Waffel"            (id 39) -> Toppings
--   "2x Waffel + 1 Getränk" (id 38) -> Toppings + Getränkeauswahl
-- Die Verknüpfung Produkt -> Optionen erfolgt im Code: src/lib/productOptions.js
-- (Name-basiert). Zucker-Extras gelten per Default für Heißgetränke & Tee.

-- 1) Options-Pool-Kategorien (im Kunden-Menü ausgeblendet via HIDDEN_OPTION_CATEGORIES).
INSERT INTO categories (name, sort_order)
SELECT 'Toppings', 90
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Toppings');

INSERT INTO categories (name, sort_order)
SELECT 'Getränke-Extras', 91
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Getränke-Extras');

-- 2) Toppings (für Waffeln). Ausverkauft-Status/Preis werden live übernommen.
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT (SELECT id FROM categories WHERE name = 'Toppings'), v.name, v.descr, v.price, true, false
FROM (VALUES
  ('Banane',        'Frische Bananenscheiben', 0.50),
  ('Schokosoße',    'Warme Schokoladensoße',   0.50),
  ('Karamellsoße',  'Cremige Karamellsoße',    0.50),
  ('Haselnusssoße', 'Nussige Haselnusssoße',   0.50),
  ('Vanilleeis',    'Eine Kugel Vanilleeis',   1.00),
  ('Puderzucker',   'Feiner Puderzucker',      0.50)
) AS v(name, descr, price)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m
  WHERE m.name = v.name
    AND m.category_id = (SELECT id FROM categories WHERE name = 'Toppings')
);

-- 3) Getränke-Extras (Zucker etc.). Namen müssen zu DRINK_EXTRAS.default passen.
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT (SELECT id FROM categories WHERE name = 'Getränke-Extras'), v.name, v.descr, v.price, true, false
FROM (VALUES
  ('Weißer Zucker',  'Ein Päckchen weißer Zucker',  0.50),
  ('Brauner Zucker', 'Ein Päckchen brauner Zucker', 0.50),
  ('Süßstoff',       'Ein Täfelchen Süßstoff',      0.50)
) AS v(name, descr, price)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m
  WHERE m.name = v.name
    AND m.category_id = (SELECT id FROM categories WHERE name = 'Getränke-Extras')
);
