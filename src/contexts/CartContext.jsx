import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

// Eindeutige Signatur einer konfigurierten Zeile (gleiche Konfiguration = zusammenführen).
function lineSignature(line) {
  const opts = (line.options || [])
    .map(o => `${o.itemId ?? o.name}:${o.qty}:${o.isDrink ? 'd' : 'e'}`)
    .sort()
    .join(',');
  return `${line.menuItemId}#${opts}`;
}

// Normalisiert (alte wie neue) Warenkorb-Zeilen auf die aktuelle Struktur.
// Schützt vor Abstürzen durch alte, im localStorage gespeicherte Artikel.
function normalizeLine(raw) {
  const unitPrice = raw.unitPrice ?? raw.price ?? 0;
  return {
    lineId: raw.lineId || lineSignature(raw),
    menuItemId: raw.menuItemId,
    name: raw.name,
    basePrice: raw.basePrice ?? unitPrice,
    unitPrice,
    quantity: raw.quantity || 1,
    isMenu: !!raw.isMenu,
    options: Array.isArray(raw.options) ? raw.options : [],
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("cafe_cart") || "[]");
      return Array.isArray(raw) ? raw.map(normalizeLine) : [];
    } catch { return []; }
  });
  const [activeOrderIds, setActiveOrderIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_active_orders") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("cafe_cart", JSON.stringify(items)); }, [items]);

  // line: { menuItemId, name, basePrice, unitPrice, quantity?, isMenu, options: [...] }
  const addItem = useCallback((line) => {
    const quantity = line.quantity || 1;
    const lineId = lineSignature(line);
    setItems(prev => {
      const existing = prev.find(i => i.lineId === lineId);
      if (existing) {
        return prev.map(i => i.lineId === lineId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      // Abwärtskompatibel: falls kein unitPrice übergeben wird, price verwenden.
      const unitPrice = line.unitPrice ?? line.price ?? 0;
      const basePrice = line.basePrice ?? unitPrice;
      return [...prev, {
        lineId,
        menuItemId: line.menuItemId,
        name: line.name,
        basePrice,
        unitPrice,
        quantity,
        isMenu: !!line.isMenu,
        options: line.options || [],
      }];
    });
  }, []);

  const removeItem = useCallback((lineId) => setItems(prev => prev.filter(i => i.lineId !== lineId)), []);

  const updateQuantity = useCallback((lineId, quantity) => {
    if (quantity <= 0) setItems(prev => prev.filter(i => i.lineId !== lineId));
    else setItems(prev => prev.map(i => i.lineId === lineId ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const addActiveOrderId = useCallback((id) => {
    setActiveOrderIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem("cafe_active_orders", JSON.stringify(next));
      return next;
    });
  }, []);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);
  const lastOrderId = activeOrderIds.length ? activeOrderIds[activeOrderIds.length - 1] : null;

  return (
    <CartContext.Provider value={{ items, count, total, activeOrderIds, lastOrderId, addItem, removeItem, updateQuantity, clearCart, addActiveOrderId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
