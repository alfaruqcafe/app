import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Minus, Coffee, CupSoda, Sandwich, ShoppingBag, Check } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { SOFT_DRINK_COLORS } from '../lib/mockData';
import {
  resolveProductOptions,
  getExtrasForDrink,
  optionCost,
  computeUnitPrice,
} from '../lib/productOptions';

const SPRING = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 };
const MIN_QTY = 1;
const MAX_QTY = 5;

// Medien-Box (Bild oder farbige Icon-Fläche) – identisches Markup wie in der Karte,
// damit der layoutId-Übergang sauber morpht.
function Media({ product, category, big }) {
  const iconSize = big ? 64 : 28;
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />;
  }
  const catId = category?.id;
  return (
    <>
      <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${category?.color || '#c9a87c'} 0%, transparent 100%)` }} />
      {catId === 'cold' || category?.name === 'Erfrischungsgetränke' ? (
        <div className="rounded-full flex items-center justify-center text-white shadow-md z-10" style={{ width: big ? 96 : 64, height: big ? 96 : 64, backgroundColor: SOFT_DRINK_COLORS[product.name] || category?.color || '#c9a87c' }}>
          <CupSoda size={big ? 44 : 28} />
        </div>
      ) : category?.name === 'Snacks' ? (
        <div className="text-primary/40 z-10"><Sandwich size={big ? 72 : 48} /></div>
      ) : (
        <div className="text-primary/40 z-10"><Coffee size={big ? 72 : 48} /></div>
      )}
    </>
  );
}

// Eine Options-Zeile: vor Auswahl nur Name; nach Aktivieren Preis + Mengensteuerung.
function OptionRow({ item, selected, qty, price, isMenu, onToggle, onQty, radio }) {
  const soldOut = !item.available;
  const cost = optionCost(price, qty || 1, isMenu);

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => !soldOut && onToggle()}
      className={clsx(
        'w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
        soldOut ? 'border-[#e5d9c8] bg-gray-50 opacity-60 cursor-not-allowed'
          : selected ? 'border-primary bg-primary/5 cursor-pointer'
          : 'border-[#e5d9c8] bg-white hover:border-primary/40 cursor-pointer active:scale-[0.99]'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={clsx(
          'flex items-center justify-center shrink-0 border transition-colors',
          radio ? 'w-5 h-5 rounded-full' : 'w-5 h-5 rounded-md',
          selected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
        )}>
          {selected && <Check size={13} strokeWidth={3} />}
        </span>
        <span className={clsx('font-bold text-[13px] truncate', soldOut && 'line-through')}>{item.name}</span>
        {soldOut && (
          <span className="shrink-0 bg-white text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#e5d9c8]">Ausverkauft</span>
        )}
      </div>

      {/* Bedienelemente erst nach Auswahl */}
      {selected && !soldOut && (
        radio ? (
          <span className="text-[11px] font-bold text-primary shrink-0">inklusive</span>
        ) : (
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            <span className="font-bold text-[13px] text-primary whitespace-nowrap min-w-[52px] text-right">{cost.toFixed(2)} €</span>
            <div className="flex items-center gap-1.5">
              <span
                role="button"
                onClick={() => onQty(Math.max(MIN_QTY, (qty || 1) - 1))}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-200"
              >
                <Minus size={13} strokeWidth={3} />
              </span>
              <span className="font-bold text-[13px] min-w-[16px] text-center">{qty || 1}</span>
              <span
                role="button"
                onClick={() => onQty(Math.min(MAX_QTY, (qty || 1) + 1))}
                className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-light"
              >
                <Plus size={13} strokeWidth={3} />
              </span>
            </div>
          </div>
        )
      )}
    </button>
  );
}

export function ProductDetail({ product, category, categories, onClose }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const { isMenu, groups } = useMemo(
    () => resolveProductOptions(product, categories),
    [product, categories]
  );

  // Auswahl-Zustände
  const [sel, setSel] = useState({});           // itemId -> qty (Toppings + Extras)
  const [chosenDrinkId, setChosenDrinkId] = useState(null);

  const toggle = (id) => setSel(prev => {
    const next = { ...prev };
    if (next[id]) delete next[id];
    else next[id] = 1;
    return next;
  });
  const setQty = (id, q) => setSel(prev => ({ ...prev, [id]: q }));

  // Getränkeauswahl-Gruppe (falls vorhanden) und die aktiven Extras dazu.
  const drinkGroup = groups.find(g => g.kind === 'drinkChoice');
  const chosenDrink = drinkGroup && chosenDrinkId != null
    ? drinkGroup.drinks.find(d => d.id === chosenDrinkId)
    : null;

  // Alle aktuell sichtbaren Extra-Items (für Preis-Filterung, damit abgewählte
  // Getränk-Extras nicht mitzählen).
  const activeExtras = useMemo(() => {
    const list = [];
    for (const g of groups) {
      if (g.kind === 'selfExtras' || g.kind === 'fixedDrink') list.push(...(g.extras || []));
    }
    if (chosenDrink) list.push(...getExtrasForDrink(chosenDrink.name, categories));
    return list;
  }, [groups, chosenDrink, categories]);

  const toppingItems = useMemo(
    () => groups.filter(g => g.kind === 'toppings').flatMap(g => g.items),
    [groups]
  );

  // Bepreiste Auswahl (Toppings + aktive Extras) zusammenstellen.
  const pricedSelections = useMemo(() => {
    const out = [];
    const byId = new Map();
    [...toppingItems, ...activeExtras].forEach(it => byId.set(it.id, it));
    for (const [id, qty] of Object.entries(sel)) {
      const it = byId.get(Number(id)) || byId.get(id);
      if (it && qty > 0) out.push({ item: it, qty });
    }
    return out;
  }, [sel, toppingItems, activeExtras]);

  const unitPrice = useMemo(
    () => computeUnitPrice(product.price, pricedSelections.map(s => ({ price: s.item.price, qty: s.qty })), isMenu),
    [product.price, pricedSelections, isMenu]
  );

  const needsDrink = !!drinkGroup;
  const drinkMissing = needsDrink && !chosenDrink;

  function handleAdd() {
    if (drinkMissing || !product.available) return;

    const options = [];
    // Toppings zuerst
    for (const g of groups.filter(x => x.kind === 'toppings')) {
      for (const it of g.items) {
        const qty = sel[it.id];
        if (qty > 0) options.push({ groupTitle: g.title, itemId: it.id, name: it.name, qty, price: it.price, lineTotal: optionCost(it.price, qty, isMenu), free: isMenu });
      }
    }
    // Getränk (inklusive) + dessen Extras
    if (chosenDrink) {
      options.push({ groupTitle: drinkGroup.title, itemId: chosenDrink.id, name: chosenDrink.name, qty: 1, price: 0, lineTotal: 0, isDrink: true });
    }
    for (const g of groups.filter(x => x.kind === 'fixedDrink')) {
      if (g.drink) options.push({ groupTitle: g.title, itemId: g.drink.id, name: g.drink.name, qty: 1, price: 0, lineTotal: 0, isDrink: true });
    }
    // Extras (aktive)
    for (const it of activeExtras) {
      const qty = sel[it.id];
      if (qty > 0) options.push({ groupTitle: 'Extras', itemId: it.id, name: it.name, qty, price: it.price, lineTotal: optionCost(it.price, qty, isMenu), free: isMenu });
    }

    addItem({ menuItemId: product.id, name: product.name, basePrice: product.price, unitPrice, quantity: 1, isMenu, options });
    showToast(`${product.name} hinzugefügt`);
    onClose();
  }

  const renderExtras = (extras, title) => extras.length > 0 && (
    <div className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-2.5">{title}</p>
      <div className="flex flex-col gap-2">
        {extras.map(it => (
          <OptionRow key={it.id} item={it} selected={!!sel[it.id]} qty={sel[it.id]} price={it.price} isMenu={isMenu}
            onToggle={() => toggle(it.id)} onQty={q => setQty(it.id, q)} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[210] flex justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel (Shared-Element) */}
      <motion.div
        layoutId={`card-${product.id}`}
        transition={SPRING}
        className="absolute inset-x-0 bottom-0 top-[4%] w-full max-w-[480px] mx-auto bg-[#fdfbf7] rounded-t-[2rem] overflow-hidden flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.35)]"
      >
        {/* Hero-Bild */}
        <motion.div layoutId={`media-${product.id}`} transition={SPRING} className="relative h-56 w-full shrink-0 flex items-center justify-center bg-gray-50 overflow-hidden">
          <Media product={product} category={category} big />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center cursor-pointer hover:bg-black/55 transition-colors"
          >
            <X size={20} />
          </button>
          {!product.available && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="bg-white text-gray-600 text-[12px] font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">Ausverkauft</span>
            </div>
          )}
        </motion.div>

        {/* Scrollbarer Inhalt */}
        <motion.div
          className="flex-1 overflow-y-auto px-5 pt-4 pb-4"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.25 }}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="font-serif text-[22px] font-bold text-[#3d1f0f] m-0 leading-tight">{product.name}</h2>
            <span className="font-bold text-[16px] text-primary whitespace-nowrap mt-1">{product.price.toFixed(2)} €</span>
          </div>
          {isMenu && <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-2">Menü</span>}
          {product.description && (
            <p className="text-[13px] text-gray-500 leading-relaxed m-0 mt-1">{product.description}</p>
          )}

          {/* Options-Gruppen */}
          {groups.map((g, gi) => {
            if (g.kind === 'toppings') {
              return (
                <div key={gi} className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-2.5">{g.title}</p>
                  <div className="flex flex-col gap-2">
                    {g.items.length === 0 && <p className="text-[12px] text-gray-400 italic">Keine Toppings verfügbar.</p>}
                    {g.items.map(it => (
                      <OptionRow key={it.id} item={it} selected={!!sel[it.id]} qty={sel[it.id]} price={it.price} isMenu={isMenu}
                        onToggle={() => toggle(it.id)} onQty={q => setQty(it.id, q)} />
                    ))}
                  </div>
                </div>
              );
            }
            if (g.kind === 'drinkChoice') {
              return (
                <div key={gi} className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-2.5">{g.title}</p>
                  <div className="flex flex-col gap-2">
                    {g.drinks.map(d => (
                      <OptionRow key={d.id} item={d} radio selected={chosenDrinkId === d.id} isMenu={isMenu}
                        onToggle={() => setChosenDrinkId(prev => prev === d.id ? null : d.id)} onQty={() => {}} price={0} />
                    ))}
                  </div>
                  {chosenDrink && renderExtras(getExtrasForDrink(chosenDrink.name, categories), `Extras für ${chosenDrink.name}`)}
                </div>
              );
            }
            if (g.kind === 'fixedDrink') {
              return (
                <div key={gi} className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-2.5">Getränk</p>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 flex items-center justify-between">
                    <span className="font-bold text-[13px]">{g.drink?.name || g.title}</span>
                    <span className="text-[11px] font-bold text-primary">inklusive</span>
                  </div>
                  {renderExtras(g.extras || [], `Extras für ${g.drink?.name || g.title}`)}
                </div>
              );
            }
            if (g.kind === 'selfExtras') {
              return <div key={gi}>{renderExtras(g.extras || [], g.title)}</div>;
            }
            return null;
          })}
        </motion.div>

        {/* Footer: Gesamtpreis + Hinzufügen */}
        <motion.div
          className="p-4 border-t border-[#e5d9c8] bg-white shrink-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
        >
          {drinkMissing && (
            <p className="text-[12px] text-amber-600 font-medium mb-2 text-center">Bitte ein Getränk auswählen.</p>
          )}
          <button
            onClick={handleAdd}
            disabled={drinkMissing || !product.available}
            className={clsx(
              'w-full p-3.5 rounded-xl bg-grad text-white border-none font-bold text-[15px] cursor-pointer flex justify-between items-center shadow-lg shadow-primary/20 transition-all',
              (drinkMissing || !product.available) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            )}
          >
            <span className="flex items-center gap-2"><ShoppingBag size={18} /> In den Warenkorb</span>
            <span>{unitPrice.toFixed(2)} €</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
