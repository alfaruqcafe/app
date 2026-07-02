import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { isActiveStatus } from '../lib/orderStatus';
import { useAuth } from './AuthContext';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            menu_item_id,
            quantity,
            unit_price,
            menu_items ( name )
          )
        `);

      // Filter by customer_id if standard user (customer)
      if (user.role === 'customer') {
        query = query.eq('customer_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const fullOrders = data.map(o => ({
          id: o.id,
          tableNumber: o.table_number,
          customerName: o.customer_name,
          customerId: o.customer_id,
          note: o.note,
          status: o.status,
          totalPrice: Number(o.total_price),
          isPaid: o.is_paid || false,
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
  }, [user]);

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
          customer_id: orderData.customerId || null,
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

      // Notify staff
      try {
        const { sendPushNotification } = await import('../lib/push');
        await sendPushNotification({
          title: `Neue Bestellung!`,
          body: `Tisch ${orderData.tableNumber} hat bestellt.`,
          url: `/staff`,
          targetRole: ['staff', 'admin']
        });
      } catch (e) {
        // Ignore errors
      }

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
      
      // Notify customer (we don't have user_id linked to order right now unless they are logged in, 
      // but we broadcast to 'customer' role for the demo or if we had targetUserId we'd use it)
      const statusText = newStatus === 'completed' ? 'Fertig! 🎉' : newStatus === 'preparing' ? 'Wird zubereitet 👩‍🍳' : 'Abgeschlossen';
      try {
        const { sendPushNotification } = await import('../lib/push');
        await sendPushNotification({
          title: `Bestellung #${orderId.toString().slice(-4)}`,
          body: `Status geändert: ${statusText}`,
          url: `/order/${orderId}`,
          targetRole: 'customer' // Ideal wäre hier die targetUserId des Kunden
        });
      } catch(e) {
        // Ignore push errors so it doesn't break UI
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const markOrderAsPaid = async (orderId) => {
    if (!supabase) return;

    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isPaid: true } : o));

      const { error } = await supabase
        .from('orders')
        .update({ is_paid: true })
        .eq('id', orderId);

      if (error) {
        fetchOrders();
        throw error;
      }
    } catch (err) {
      console.error("Failed to mark order as paid:", err);
    }
  };

  const getOrder = (id) => orders.find(o => o.id === Number(id));

  const activeOrders = useMemo(() => orders.filter(o => isActiveStatus(o.status)), [orders]);

  return (
    <OrdersContext.Provider value={{ orders, activeOrders, addOrder, updateOrderStatus, markOrderAsPaid, getOrder, loading }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
