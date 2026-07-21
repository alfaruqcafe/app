import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useMenu } from '../contexts/MenuContext';
import { SOFT_DRINK_COLORS } from '../lib/mockData';
import { HIDDEN_OPTION_CATEGORIES } from '../lib/productOptions';
import { CartDrawer } from '../components/CartDrawer';
import { ProductDetail } from '../components/ProductDetail';
import { ShoppingBag, Coffee, CupSoda, Sandwich, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

const SPRING = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 };

export function Menu() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role === 'cashier') {
    return <Navigate to="/cashier" replace />;
  }

  const { categories } = useMenu();
  const { count, lastOrderId } = useCart();

  const canOrder = true;

  const [activeCategory, setActiveCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { product, category }

  const handleBack = () => {
    if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'cashier') navigate('/cashier');
    else if (user?.role === 'staff') navigate('/staff');
    else navigate('/');
  };

  // Options-Pool-Kategorien (Toppings, Getränke-Extras) nicht als Produkte anzeigen.
  const visibleCategories = categories.filter(c => !HIDDEN_OPTION_CATEGORIES.includes(c.name));

  return (
    <LayoutGroup>
      <div className="pb-36 bg-[#fdfbf7] min-h-screen">
        {/* Header */}
        <div className="pt-12 px-5 pb-6 bg-grad rounded-b-[2.5rem] shadow-sm mb-6">
          {canOrder && (
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 bg-white/10 text-white border-none w-max px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/20 transition-colors text-[13px] font-bold"
            >
              ← Zurück zur Übersicht
            </button>
          )}
          <h1 className="font-serif text-[28px] font-bold text-white m-0 mb-1">
            {canOrder ? "Neue Bestellung" : "Speisekarte"}
          </h1>
          <p className="text-white/70 text-[13px] m-0">
            {canOrder ? "Tippen zum Öffnen & Anpassen" : "Unsere aktuellen Angebote"}
          </p>

          {lastOrderId && !canOrder && (
            <button
              onClick={() => navigate(`/order/${lastOrderId}`)}
              className="mt-4 flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-white/25 transition-colors"
            >
              <ClipboardList size={14} /> Bestellstatus ansehen
            </button>
          )}
        </div>

        <div className="px-5 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max pb-2">
            {visibleCategories.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-3 rounded-full font-bold text-[13px] transition-all cursor-pointer border-none shadow-sm",
                    isActive ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Icon size={16} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Categories */}
        <div className="px-5 pb-10 flex flex-col gap-10">
          {visibleCategories.map(category => {
            const mainItems = category.items.filter(i => !i.isExtra);

            return (
              <div key={category.id} id={`category-${category.id}`}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-serif text-[20px] font-bold m-0">{category.name}</h2>
                  <div className="flex-1 h-px bg-[#e5d9c8]" />
                  <span className="text-[10px] font-bold border border-[#e5d9c8] rounded-full px-2 py-0.5 text-gray-400">
                    {mainItems.length} Artikel
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mainItems.map(item => (
                    <motion.button
                      key={item.id}
                      layoutId={`card-${item.id}`}
                      transition={SPRING}
                      onClick={() => item.available && setSelected({ product: item, category })}
                      disabled={!item.available}
                      className={clsx(
                        "text-left bg-white rounded-2xl overflow-hidden flex flex-col relative border border-[#e5d9c8] shadow-sm",
                        item.available ? "active:scale-95 cursor-pointer" : "cursor-default opacity-60"
                      )}
                    >
                      {/* Image/Color Box */}
                      <motion.div layoutId={`media-${item.id}`} transition={SPRING} className="h-28 w-full shrink-0 relative flex items-center justify-center bg-gray-50 border-b border-[#e5d9c8]/50 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${category.color} 0%, transparent 100%)` }}></div>
                            {category.name === 'Erfrischungsgetränke' ? (
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md z-10"
                                style={{ backgroundColor: SOFT_DRINK_COLORS[item.name] || category.color }}
                              >
                                <CupSoda size={28} />
                              </div>
                            ) : category.name === 'Snacks' ? (
                              <div className="text-primary/40 z-10"><Sandwich size={48} /></div>
                            ) : (
                              <div className="text-primary/40 z-10"><Coffee size={48} /></div>
                            )}
                          </>
                        )}
                        {!item.available && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                            <span className="bg-white text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Ausverkauft</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-primary text-white text-[12px] font-bold px-2 py-1 rounded-lg shadow-sm z-20">
                          {item.price === 0 ? "Gratis" : `${item.price.toFixed(2)} €`}
                        </span>
                      </motion.div>

                      {/* Info */}
                      <div className="p-2.5 flex-1 bg-white">
                        <p className="font-bold text-[13px] m-0 mb-0.5 leading-tight text-[#3d1f0f] line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-gray-400 m-0 leading-snug line-clamp-2 min-h-[1.9rem]">{item.description || ''}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Cart Button */}
        {canOrder && (
          <div className="fixed bottom-24 right-4 z-40">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 bg-grad text-white border-none rounded-full px-5 py-3.5 font-bold text-[14px] cursor-pointer shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingBag size={20} />
              {count > 0 ? (
                <span className="bg-white text-primary rounded-full min-w-[20px] h-[20px] px-1 text-[11px] font-black flex items-center justify-center">
                  {count}
                </span>
              ) : (
                <span className="opacity-80 text-[13px]">Warenkorb</span>
              )}
            </button>
          </div>
        )}

        {canOrder && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
      </div>

      {/* Produktdetail (Hero-Animation) */}
      <AnimatePresence>
        {selected && (
          <ProductDetail
            key={selected.product.id}
            product={selected.product}
            category={selected.category}
            categories={categories}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
