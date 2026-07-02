-- Menü-Update: Inhalte von der aktuellen Menükarte einpflegen
-- Sicher mehrfach ausführbar: Kategorien/Artikel werden nur angelegt, wenn sie
-- noch nicht existieren (per Name geprüft). Bereits vorhandene Artikel mit
-- abweichenden Preisen/Beschreibungen werden per UPDATE aktualisiert.

-- 1) Kategorien sicherstellen
INSERT INTO categories (name, sort_order)
SELECT 'Heißgetränke', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Heißgetränke');

INSERT INTO categories (name, sort_order)
SELECT 'Tee', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Tee');

INSERT INTO categories (name, sort_order)
SELECT 'Erfrischungsgetränke', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Erfrischungsgetränke');

INSERT INTO categories (name, sort_order)
SELECT 'Snacks', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Snacks');

-- 2) Bestehende Artikel aktualisieren (Preis/Beschreibung laut neuer Karte)
UPDATE menu_items SET price = 3.50, description = 'Klassiker zum Entspannen – perfekt für eine kleine Pause.'
WHERE name = 'Cappuccino';

UPDATE menu_items SET price = 2.00, description = 'Kurz & stark – wenn du sofort wach sein musst.'
WHERE name = 'Espresso';

UPDATE menu_items SET price = 2.00, description = 'Erfrischend & leicht – für einen klaren Kopf.'
WHERE name = 'Minz-Tee';

UPDATE menu_items SET price = 4.99
WHERE name = 'Nachos & Dip';

-- 3) Neue Artikel: Heißgetränke
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT c.id, v.name, v.description, v.price, true, false
FROM categories c,
(VALUES
  ('Mocaccino', 'Espresso mit Schokolade – wenn du beides willst.', 3.99),
  ('Latte Macchiato', 'Sanft & milchig – beliebt für lange Gespräche.', 3.99),
  ('Kakao (Hot/Cold)', 'Cremig & schokoladig – einfach zum Wohlfühlen.', 3.99),
  ('Café Lungo', 'Mehr Schlucke, gleicher Kick – ideal zum langsamen Genießen.', 2.50),
  ('Espresso Doppio', 'Für lange Lern-Sessions – volle Konzentration.', 2.50)
) AS v(name, description, price)
WHERE c.name = 'Heißgetränke'
AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);

-- 4) Neue Artikel: Tee
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT c.id, v.name, v.description, v.price, true, false
FROM categories c,
(VALUES
  ('Kamillentee', 'Sanft & beruhigend – für deine kleine Auszeit.', 2.00),
  ('Schwarztee', 'Klassisch & aromatisch – immer eine gute Wahl.', 2.00)
) AS v(name, description, price)
WHERE c.name = 'Tee'
AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);

-- 5) Neue Artikel: Erfrischungsgetränke
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT c.id, v.name, v.description, v.price, true, false
FROM categories c,
(VALUES
  ('Golden Rush', NULL, 3.99),
  ('Red Pulse', NULL, 3.99)
) AS v(name, description, price)
WHERE c.name = 'Erfrischungsgetränke'
AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);

-- 6) Neue Artikel: Snacks (Hauptartikel)
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT c.id, v.name, v.description, v.price, true, false
FROM categories c,
(VALUES
  ('Warme Waffeln', NULL, 3.99),
  ('Today''s Deal: Nachos & Dip + Getränk', 'Nachos & Dip plus ein Erfrischungsgetränk deiner Wahl. Wunsch-Getränk bitte bei der Bestellung als Anmerkung angeben.', 7.99)
) AS v(name, description, price)
WHERE c.name = 'Snacks'
AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);

-- 7) Neue Extras/Nachschlag für Snacks (is_extra = true)
INSERT INTO menu_items (category_id, name, description, price, available, is_extra)
SELECT c.id, v.name, NULL, v.price, true, true
FROM categories c,
(VALUES
  ('Salsa-Dip', 0.50),
  ('Joghurt-Dip', 0.50),
  ('Nacho Chips', 0.50),
  ('Vanilleeis', 0.50),
  ('Schokosauce', 0.50),
  ('Vanillesauce', 0.50),
  ('Bananen', 0.50),
  ('Puderzucker', 0.00)
) AS v(name, price)
WHERE c.name = 'Snacks'
AND NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);
