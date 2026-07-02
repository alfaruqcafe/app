import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_cart") || "[]"); } catch { return []; }
  });
  const [activeOrderIds, setActiveOrderIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_active_orders") || "[]"); } catch { return []; }
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

  const addActiveOrderId = useCallback((id) => {
    setActiveOrderIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem("cafe_active_orders", JSON.stringify(next));
      return next;
    });
  }, []);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
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
