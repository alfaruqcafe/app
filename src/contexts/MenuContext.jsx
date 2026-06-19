import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Coffee, CupSoda, Sandwich } from 'lucide-react';

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      // If no Supabase connection, fallback to local storage / empty
      if (!supabase) throw new Error("No Supabase connection");

      const { data: catsData, error: catsError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (catsError) throw catsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*');
        
      if (itemsError) throw itemsError;

      // Group items by category
      const grouped = catsData.map(cat => {
        // Map icon based on name for prototype
        let Icon = Coffee;
        if (cat.name.toLowerCase().includes('tee') || cat.name.toLowerCase().includes('kalt')) Icon = CupSoda;
        else if (cat.name.toLowerCase().includes('snack')) Icon = Sandwich;
        
        return {
          id: cat.id,
          name: cat.name,
          icon: Icon,
          color: '#c9a87c', // default color
          items: itemsData
            .filter(item => item.category_id === cat.id)
            .map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: Number(item.price),
              available: item.available,
              isExtra: item.is_extra,
              imageUrl: item.image_url
            }))
        };
      });

      setCategories(grouped);
    } catch (err) {
      console.error('Error fetching menu:', err);
      // Fallback logic could go here if needed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Admin function to update an item
  const updateItem = useCallback(async (categoryId, itemId, updatedItemData) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: updatedItemData.name,
          price: updatedItemData.price,
          description: updatedItemData.description,
          image_url: updatedItemData.imageUrl
        })
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Update local state directly for snappy UI
      setCategories(prev => prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, ...updatedItemData } : item)
        };
      }));

      // Notify customers
      try {
        const { sendPushNotification } = await import('../lib/push');
        await sendPushNotification({
          title: `Neues auf der Speisekarte!`,
          body: `${updatedItemData.name} wurde aktualisiert.`,
          url: `/menu`,
          targetRole: 'customer'
        });
      } catch (e) {
        // Ignore errors
      }
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Fehler beim Speichern');
    }
  }, []);

  return (
    <MenuContext.Provider value={{ categories, updateItem, loading, refreshMenu: fetchMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
