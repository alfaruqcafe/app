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
    
    if (!supabase) return;
    
    const channel = supabase.channel('public:menu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchMenu();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
      
      setCategories(prev => prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, ...updatedItemData } : item)
        };
      }));

      try {
        const { sendPushNotification } = await import('../lib/push');
        await sendPushNotification({
          title: `Neues auf der Speisekarte!`,
          body: `${updatedItemData.name} wurde aktualisiert.`,
          url: `/menu`,
          targetRole: 'customer'
        });
      } catch (e) {}
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Fehler beim Speichern: ' + err.message);
    }
  }, []);

  const addCategory = useCallback(async (name) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').insert({ name });
      if (error) throw error;
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Hinzufügen der Kategorie: ' + err.message);
    }
  }, [fetchMenu]);

  const deleteCategory = useCallback(async (id) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen der Kategorie: ' + err.message);
    }
  }, [fetchMenu]);

  const addItem = useCallback(async (categoryId, itemData) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('menu_items').insert({
        category_id: categoryId,
        name: itemData.name,
        price: parseFloat(itemData.price),
        description: itemData.description,
        image_url: itemData.imageUrl
      });
      if (error) throw error;
      
      try {
        const { sendPushNotification } = await import('../lib/push');
        await sendPushNotification({
          title: `Neu: ${itemData.name}!`,
          body: `Jetzt neu auf unserer Speisekarte.`,
          url: `/menu`,
          targetRole: 'customer'
        });
      } catch (e) {}
      
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Hinzufügen des Artikels: ' + err.message);
    }
  }, [fetchMenu]);

  const deleteItem = useCallback(async (id) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen des Artikels: ' + err.message);
    }
  }, [fetchMenu]);

  return (
    <MenuContext.Provider value={{ 
      categories, updateItem, addCategory, deleteCategory, addItem, deleteItem, loading, refreshMenu: fetchMenu 
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
