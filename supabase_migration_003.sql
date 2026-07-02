-- Migration 003: Spalten-Korrektur für getrennte Kasse (Split Billing)
-- Fügt die fehlende Spalte 'is_paid' zu 'order_items' hinzu, da diese von der Kasse abgefragt/aktualisiert wird.

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
