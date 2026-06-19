import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cafe_orders") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("cafe_orders", JSON.stringify(orders)); }, [orders]);

  const createOrder = useCallback(async (orderData) => {
    const newOrder = {
      id: Date.now(),
      ...orderData,
      status: "pending",
      totalPrice: orderData.items.reduce((s, item) => s + (item.price * item.quantity), 0),
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);

    // Optional: Sync to Supabase later
    if (supabase) {
      try {
        // await supabase.from('orders').insert({...})
      } catch (err) {
        console.error('Failed to sync to Supabase', err);
      }
    }

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    // Optional: Sync to Supabase later
  }, []);

  const getOrder = useCallback((id) => orders.find(o => o.id === Number(id)), [orders]);

  return (
    <OrdersContext.Provider value={{ orders, createOrder, updateOrderStatus, getOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
