import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// HINWEIS (wichtig für später): Der Bestellmodus wird aktuell in localStorage
// gespeichert, NICHT in Supabase. Grund: Das dafür nötige DB-Schema (Tabelle
// "app_settings") existiert noch nicht und kann nur über den Supabase SQL
// Editor angelegt werden (siehe supabase_migration_007_...sql) — das erfordert
// Dashboard-Zugang, der aktuell nicht vorhanden ist. Für lokales Testen auf
// EINEM Gerät funktioniert das identisch. Sobald Migration 007 ausgeführt
// wurde, sollte dieser Context auf eine Supabase-Tabelle (mit Realtime-Sync
// über alle Geräte/Kassen) umgestellt werden — analog zu MenuContext.jsx.

const AppModeContext = createContext(null);
const STORAGE_KEY = 'cafe_order_mode';
const DEFAULT_MODE = 'standard';

export const ORDER_MODES = {
  standard: {
    label: 'Standard',
    description: 'Tischnummer & Lieferung wie gewohnt.',
  },
  pickup: {
    label: 'Abholmodus',
    description: 'Kein Tisch nötig – Kunden geben ihren Namen an und werden beim Aufruf per Name benachrichtigt.',
  },
  menu_only: {
    label: 'Nur Speisekarte',
    description: 'Speisekarte bleibt sichtbar, Warenkorb funktioniert, aber Bestellungen können nicht abgeschickt werden.',
  },
};

export function AppModeProvider({ children }) {
  const [orderMode, setOrderModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && ORDER_MODES[stored] ? stored : DEFAULT_MODE;
    } catch {
      return DEFAULT_MODE;
    }
  });

  // Hält mehrere offene Tabs/Fenster synchron (z. B. Admin-Ansicht + Kunden-Ansicht
  // im selben Browser während des lokalen Testens).
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY && e.newValue && ORDER_MODES[e.newValue]) {
        setOrderModeState(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setOrderMode = useCallback((mode) => {
    if (!ORDER_MODES[mode]) return;
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
    setOrderModeState(mode);
  }, []);

  return (
    <AppModeContext.Provider value={{
      orderMode,
      setOrderMode,
      isStandard: orderMode === 'standard',
      isPickup: orderMode === 'pickup',
      isMenuOnly: orderMode === 'menu_only',
    }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
