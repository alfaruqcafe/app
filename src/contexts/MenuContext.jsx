import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Coffee, CupSoda, Sandwich } from 'lucide-react';

const MenuContext = createContext(null);

// HINWEIS: Die Reihenfolge der PRODUKTE innerhalb einer Kategorie wird lokal
// (localStorage) gespeichert, weil menu_items noch keine sort_order-Spalte
// besitzt (kann nur per Supabase SQL Editor angelegt werden, siehe
// supabase_migration_007_...sql). Kategorien-Reihenfolge & -Name werden dagegen
// direkt in Supabase gespeichert (categories.sort_order/.name existieren bereits).
const ITEM_ORDER_KEY = 'cafe_item_order_overrides'; // { [categoryId]: [itemId, ...] }

function getItemOrderOverrides() {
  try { return JSON.parse(localStorage.getItem(ITEM_ORDER_KEY) || '{}'); } catch { return {}; }
}
function saveItemOrderOverrides(overrides) {
  try { localStorage.setItem(ITEM_ORDER_KEY, JSON.stringify(overrides)); } catch { /* ignore */ }
}
function applyItemOrder(items, orderedIds) {
  if (!orderedIds || !orderedIds.length) return items;
  const indexMap = new Map(orderedIds.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ai = indexMap.has(a.id) ? indexMap.get(a.id) : Infinity;
    const bi = indexMap.has(b.id) ? indexMap.get(b.id) : Infinity;
    if (ai !== bi) return ai - bi;
    return a.id - b.id;
  });
}

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
      const itemOrderOverrides = getItemOrderOverrides();
      const grouped = catsData.map(cat => {
        // Map icon based on name for prototype
        let Icon = Coffee;
        if (cat.name.toLowerCase().includes('tee') || cat.name.toLowerCase().includes('kalt')) Icon = CupSoda;
        else if (cat.name.toLowerCase().includes('snack')) Icon = Sandwich;
        
        const rawItems = itemsData
          .filter(item => item.category_id === cat.id)
          .map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            available: item.available,
            isExtra: item.is_extra,
            imageUrl: item.image_url
          }));

        return {
          id: cat.id,
          name: cat.name,
          icon: Icon,
          color: '#c9a87c', // default color
          items: applyItemOrder(rawItems, itemOrderOverrides[cat.id])
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

  const toggleAvailability = useCallback(async (itemId, currentAvailable) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentAvailable })
        .eq('id', itemId);
      if (error) throw error;
      // Realtime-Subscription oben triggert automatisch fetchMenu() bei allen Clients
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Fehler beim Umschalten: ' + err.message);
    }
  }, []);

  const renameCategory = useCallback(async (id, name) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').update({ name }).eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    } catch (err) {
      console.error('Error renaming category:', err);
      alert('Fehler beim Umbenennen: ' + err.message);
    }
  }, []);

  // Kategorien-Reihenfolge: categories.sort_order existiert bereits, wird
  // direkt in Supabase persistiert (für alle Nutzer sichtbar).
  const reorderCategories = useCallback(async (orderedIds) => {
    setCategories(prev => {
      const byId = new Map(prev.map(c => [c.id, c]));
      return orderedIds.map(id => byId.get(id)).filter(Boolean);
    });
    if (!supabase) return;
    try {
      const { error } = await Promise.all(
        orderedIds.map((id, idx) => supabase.from('categories').update({ sort_order: idx }).eq('id', id))
      ).then(results => ({ error: results.find(r => r.error)?.error }));
      if (error) throw error;
    } catch (err) {
      console.error('Error reordering categories:', err);
      fetchMenu();
    }
  }, [fetchMenu]);

  // Produkt-Reihenfolge innerhalb einer Kategorie: lokal gespeichert (siehe
  // Hinweis oben), bis menu_items eine sort_order-Spalte hat.
  const reorderItems = useCallback((categoryId, orderedItemIds) => {
    const overrides = getItemOrderOverrides();
    overrides[categoryId] = orderedItemIds;
    saveItemOrderOverrides(overrides);
    setCategories(prev => prev.map(cat =>
      cat.id !== categoryId ? cat : { ...cat, items: applyItemOrder(cat.items, orderedItemIds) }
    ));
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
      categories, updateItem, addCategory, deleteCategory, addItem, deleteItem, toggleAvailability,
      renameCategory, reorderCategories, reorderItems, loading, refreshMenu: fetchMenu
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
