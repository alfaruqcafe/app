import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            menu_item_id,
            quantity,
            unit_price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to frontend format
      const formattedOrders = data.map(o => ({
        id: o.id,
        tableNumber: o.table_number,
        customerName: o.customer_name,
        note: o.note,
        status: o.status,
        totalPrice: Number(o.total_price),
        createdAt: o.created_at,
        items: o.items.map(i => ({
          menuItemId: i.menu_item_id,
          quantity: i.quantity,
          price: Number(i.unit_price),
          // We don't have the item name directly here without a join, 
          // but we can join menu_items or fetch it if needed.
          // For simplicity in the prototype, we assume we fetch it via a separate query or join it.
          // In a real app we'd do a join: `items:order_items(*, menu_items(name))`
        }))
      }));

      // Let's do a better fetch with joined menu item names
      const { data: joinedData, error: joinError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            menu_item_id,
            quantity,
            unit_price,
            menu_items ( name )
          )
        `)
        .order('created_at', { ascending: false });

      if (!joinError && joinedData) {
        const fullOrders = joinedData.map(o => ({
          id: o.id,
          tableNumber: o.table_number,
          customerName: o.customer_name,
          note: o.note,
          status: o.status,
          totalPrice: Number(o.total_price),
          createdAt: o.created_at,
          items: o.items.map(i => ({
            menuItemId: i.menu_item_id,
            menuItemName: i.menu_items?.name || 'Unbekannter Artikel',
            quantity: i.quantity,
            price: Number(i.unit_price)
          }))
        }));
        setOrders(fullOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (supabase) {
      // Subscribe to real-time changes on orders
      const subscription = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders(); // Refetch all to keep it simple, or handle updates incrementally
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [fetchOrders]);

  const addOrder = async (orderData) => {
    if (!supabase) return 999; // Fallback ID
    
    try {
      // Insert order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: orderData.tableNumber,
          customer_name: orderData.customerName || null,
          note: orderData.note || null,
          total_price: orderData.totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert items
      const orderItems = orderData.items.map(item => ({
        order_id: orderResult.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderResult.id;
    } catch (err) {
      console.error("Failed to add order", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!supabase) return;

    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        // Revert on error
        fetchOrders();
        throw error;
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getOrder = (id) => orders.find(o => o.id === Number(id));

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrder, loading }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
