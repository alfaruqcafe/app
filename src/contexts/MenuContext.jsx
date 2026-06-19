import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_CATEGORIES } from '../lib/mockData';

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState(() => {
    try { 
      const saved = localStorage.getItem("cafe_menu");
      if (saved) return JSON.parse(saved);
      return MOCK_CATEGORIES;
    } catch { 
      return MOCK_CATEGORIES; 
    }
  });

  useEffect(() => { 
    localStorage.setItem("cafe_menu", JSON.stringify(categories)); 
  }, [categories]);

  const updateItem = useCallback((categoryId, itemId, updatedItemData) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === itemId ? { ...item, ...updatedItemData } : item)
      };
    }));
  }, []);

  return (
    <MenuContext.Provider value={{ categories, updateItem }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
