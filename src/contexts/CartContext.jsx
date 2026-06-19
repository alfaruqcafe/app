import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_cart") || "[]"); } catch { return []; }
  });
  const [lastOrderId, setLastOrderIdState] = useState(() => {
    try { const v = localStorage.getItem("cafe_last_order"); return v ? Number(v) : null; } catch { return null; }
  });

  useEffect(() => { localStorage.setItem("cafe_cart", JSON.stringify(items)); }, [items]);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId);
      if (existing) return prev.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((menuItemId) => setItems(prev => prev.filter(i => i.menuItemId !== menuItemId)), []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) setItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
    else setItems(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const setLastOrderId = useCallback((id) => {
    setLastOrderIdState(id);
    localStorage.setItem("cafe_last_order", String(id));
  }, []);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, lastOrderId, addItem, removeItem, updateQuantity, clearCart, setLastOrderId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
