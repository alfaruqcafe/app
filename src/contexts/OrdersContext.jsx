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
            id,
            menu_item_id,
            quantity,
            unit_price,
            is_paid,
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
            id: i.id,
            menuItemId: i.menu_item_id,
            menuItemName: i.menu_items?.name || 'Unbekannter Artikel',
            quantity: i.quantity,
            price: Number(i.unit_price),
            isPaid: i.is_paid || false
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
      
      // Notify customer (only the specific customer who placed this order)
      const statusText = newStatus === 'ready' ? 'Fertig / Abholbereit! 🎉' : newStatus === 'preparing' ? 'Wird zubereitet 👩‍🍳' : newStatus === 'delivered' ? 'Geliefert' : 'Abgeschlossen';
      try {
        const order = getOrder(orderId);
        if (order && order.customerId) {
          const { sendPushNotification } = await import('../lib/push');
          await sendPushNotification({
            title: `Bestellung #${orderId.toString().slice(-4)}`,
            body: `Status geändert: ${statusText}`,
            url: `/order/${orderId}`,
            targetUserId: order.customerId
          });
        }
      } catch(e) {
        // Ignore push errors so it doesn't break UI
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const updateOrderPaymentStatus = async (orderId, isPaid) => {
    if (!supabase) return;

    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          isPaid,
          items: o.items.map(item => ({ ...item, isPaid }))
        };
      }));

      // 1. Update the order table
      const { error: orderError } = await supabase
        .from('orders')
        .update({ is_paid: isPaid })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 2. Update all sibling order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ is_paid: isPaid })
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

    } catch (err) {
      console.error("Failed to update order payment status:", err);
      fetchOrders();
    }
  };

  const updateOrderItemPaymentStatus = async (orderId, itemId, isPaid) => {
    if (!supabase) return;

    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.map(item => 
          item.id === itemId ? { ...item, isPaid } : item
        );
        const allPaid = updatedItems.every(item => item.isPaid);
        return {
          ...o,
          items: updatedItems,
          isPaid: allPaid
        };
      }));

      // 1. Update this specific order item in database
      const { error: itemError } = await supabase
        .from('order_items')
        .update({ is_paid: isPaid })
        .eq('id', itemId);

      if (itemError) throw itemError;

      // 2. Fetch status of all order items for this order to compute correct parent order payment status
      const { data: siblingItems, error: queryError } = await supabase
        .from('order_items')
        .select('is_paid')
        .eq('order_id', orderId);

      if (queryError) throw queryError;

      const allPaid = siblingItems.every(item => item.is_paid);

      // 3. Update the main order row
      const { error: orderError } = await supabase
        .from('orders')
        .update({ is_paid: allPaid })
        .eq('id', orderId);

      if (orderError) throw orderError;

    } catch (err) {
      console.error("Failed to update order item payment status:", err);
      fetchOrders();
    }
  };

  const getOrder = (id) => orders.find(o => o.id === Number(id));

  const activeOrders = useMemo(() => orders.filter(o => isActiveStatus(o.status)), [orders]);

  return (
    <OrdersContext.Provider value={{ orders, activeOrders, addOrder, updateOrderStatus, updateOrderPaymentStatus, updateOrderItemPaymentStatus, getOrder, loading }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
