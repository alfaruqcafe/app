import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useAppMode } from '../contexts/AppModeContext';
import { buildOptionsSummary } from '../lib/productOptions';
import { X, ShoppingBag, Plus, Minus, Trash2, ClipboardList, ArrowRight, ArrowLeft, Check, Bell, Ban } from 'lucide-react';
import clsx from 'clsx';

// Sentinel: table_number = 0 bedeutet "kein Tisch / Abholung" (Abholmodus).
// So ist keine Datenbank-Migration nötig (Spalte ist NOT NULL INTEGER).
const PICKUP_TABLE_SENTINEL = 0;

// Baut eine lesbare Bestell-Notiz aus Kundennotiz + Extra-Aufschlüsselung je Zeile.
function composeNote(items, customNote) {
  const optionBlocks = items
    .filter(i => i.options && i.options.length)
    .map(i => {
      const head = `${i.quantity}× ${i.name}`;
      const parts = buildOptionsSummary(i.options).map(s => `   • ${s}`);
      return [head, ...parts].join('\n');
    });
  return [customNote?.trim(), optionBlocks.join('\n')].filter(Boolean).join('\n\n') || null;
}

export function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { items, count, total, lastOrderId, updateQuantity, removeItem, clearCart, addActiveOrderId } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isPickup, isMenuOnly } = useAppMode();

  const [step, setStep] = useState("cart");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  function handleClose() {
    const isDone = step === "done";
    setStep("cart");
    setError(null);
    onClose();
    if (isDone && user && (user.role === 'staff' || user.role === 'admin' || user.role === 'cashier')) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'cashier') navigate('/cashier');
      else navigate('/staff');
    }
  }

  async function handleSubmit() {
    if (isPickup) {
      if (!customerName.trim()) {
        setError("Bitte deinen Namen angeben.");
        return;
      }
    } else if (!tableNumber) {
      setError("Bitte Tischnummer auswählen.");
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const orderId = await addOrder({
        tableNumber: isPickup ? PICKUP_TABLE_SENTINEL : tableNumber.trim(),
        customerName: customerName || null,
        customerId: user?.id || null,
        note: composeNote(items, note),
        totalPrice: total,
        items: items.map(i => ({ menuItemId: i.menuItemId, price: i.unitPrice, quantity: i.quantity }))
      });

      addActiveOrderId(orderId);
      clearCart();
      setTableNumber("");
      setCustomerName("");
      setNote("");
      setStep("done");
      showToast("Bestellung erfolgreich aufgegeben!");
    } catch (err) {
      console.error(err);
      setError("Fehler bei der Bestellung: " + (err.message || "Unbekannt"));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 w-full max-w-[480px] bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-[0_-4px_40px_rgba(0,0,0,0.2)] pb-safe animate-in slide-in-from-bottom-full duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5d9c8]">
          <div className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="text-primary" size={20} />
            {step === "cart" ? "Warenkorb" : step === "checkout" ? "Bestellung aufgeben" : "Bestellung abgeschickt!"}
          </div>
          <button
            onClick={handleClose}
            className="border-none bg-transparent text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* CART STEP */}
          {step === "cart" && (
            items.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3 flex justify-center text-gray-300"><ShoppingBag size={64} strokeWidth={1} /></div>
                <p className="text-gray-400 font-bold mb-4">Warenkorb ist leer</p>
                {lastOrderId && (
                  <button
                    onClick={() => { handleClose(); navigate(`/order/${lastOrderId}`); }}
                    className="mt-2 px-5 py-2.5 rounded-xl border border-primary bg-transparent text-primary font-bold cursor-pointer flex items-center justify-center gap-2 mx-auto hover:bg-primary/5 transition-colors"
                  >
                    <ClipboardList size={18} /> Letzte Bestellung ansehen
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map(item => (
                  <div key={item.lineId} className="flex items-start gap-3 p-3 bg-[#fafaf8] rounded-xl border border-[#e5d9c8]">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm m-0 leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-400 m-0 mt-0.5">{item.unitPrice.toFixed(2)} €</p>
                      {item.options && item.options.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-0.5">
                          {buildOptionsSummary(item.options).map((s, idx) => (
                            <li key={idx} className="text-[11px] text-gray-500 leading-snug">• {s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border-none bg-gray-100 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-200"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="font-bold min-w-[20px] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border-none bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-light transition-colors"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => removeItem(item.lineId)}
                        className="w-7 h-7 rounded-full border-none bg-red-100 text-red-600 flex items-center justify-center cursor-pointer ml-1 hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* CHECKOUT STEP */}
          {step === "checkout" && (
            <div className="flex flex-col gap-4">
              {isPickup ? (
                <div>
                  <label className="text-[13px] font-bold block mb-1.5 text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Wie sollen wir dich aufrufen?"
                    className="w-full p-3 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 m-0">Kein Tisch nötig – du wirst per Namen aufgerufen.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[13px] font-bold block mb-1.5 text-gray-700">Tischnummer *</label>
                    <select
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-all"
                    >
                      <option value="">Tisch auswählen...</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          Tisch {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold block mb-1.5 text-gray-700">Name (optional)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Für wen?"
                      className="w-full p-3 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-[13px] font-bold block mb-1.5 text-gray-700">Anmerkung (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Individuelle Sonderwünsche?"
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="bg-[#fef3c7] rounded-xl p-3 border border-[#fde68a]">
                {items.map(i => (
                  <div key={i.lineId} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between text-[13px]">
                      <span>{i.quantity}× {i.name}</span>
                      <span className="text-gray-500">{(i.unitPrice * i.quantity).toFixed(2)} €</span>
                    </div>
                    {i.options && i.options.length > 0 && (
                      <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {buildOptionsSummary(i.options).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-[#fde68a] mt-2">
                  <span>Gesamt</span>
                  <span className="text-primary">{total.toFixed(2)} €</span>
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-[13px] font-medium">{error}</div>}
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Check size={32} strokeWidth={3} />
              </div>
              <p className="font-bold text-lg mb-2 text-[#3d1f0f]">Bestellung abgeschlossen!</p>
              <p className="text-gray-500 text-sm mb-6 max-w-[240px] mx-auto leading-relaxed">
                Wir bereiten deine Bestellung jetzt vor.
              </p>

              <div className="flex flex-col gap-3">
                {lastOrderId && (
                  <button
                    onClick={() => { handleClose(); navigate(`/order/${lastOrderId}`); }}
                    className="w-full p-3.5 rounded-xl border border-primary bg-transparent text-primary font-bold cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    Bestellung ansehen
                  </button>
                )}

                {!hasNotificationPermission && (
                  <button
                    onClick={async () => {
                      try {
                        const { subscribeToPushNotifications } = await import('../lib/push');
                        await subscribeToPushNotifications(user?.id, 'customer');
                        showToast("Benachrichtigungen aktiviert!");
                        setHasNotificationPermission(true);
                      } catch (err) {
                        showToast(err.message || "Fehler beim Aktivieren der Benachrichtigungen");
                      }
                    }}
                    className="w-full p-3.5 rounded-xl border-none bg-primary text-white font-bold cursor-pointer hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell size={18} /> Bei Updates benachrichtigen
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full p-3.5 rounded-xl border-none bg-gray-100 text-gray-700 font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5d9c8] bg-white">
          {step === "cart" && items.length > 0 && isMenuOnly && (
            <div className="w-full p-3.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-[13px] flex items-center justify-center gap-2 text-center">
              <Ban size={16} /> Aktuell werden keine Bestellungen angenommen.
            </div>
          )}
          {step === "cart" && items.length > 0 && !isMenuOnly && (
            <button
              onClick={() => setStep("checkout")}
              className="w-full p-3.5 rounded-xl bg-grad text-white border-none font-bold text-[15px] cursor-pointer flex justify-between items-center shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              <span>{count} Artikel · {total.toFixed(2)} €</span>
              <span className="flex items-center gap-1">Weiter <ArrowRight size={18} /></span>
            </button>
          )}

          {step === "checkout" && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep("cart")}
                className="flex-1 p-3.5 rounded-xl border border-[#e5d9c8] bg-white font-bold cursor-pointer flex items-center justify-center gap-1 active:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} /> Zurück
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={clsx(
                  "flex-[2] p-3.5 rounded-xl bg-grad text-white border-none font-bold cursor-pointer shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2",
                  loading && "opacity-70 cursor-not-allowed scale-100"
                )}
              >
                {loading ? "Wird gesendet…" : "Jetzt bestellen"}
              </button>
            </div>
          )}

          {step === "done" && (
            <button
              onClick={handleClose}
              className="w-full p-3.5 rounded-xl border border-[#e5d9c8] bg-white font-bold cursor-pointer active:bg-gray-50 transition-colors"
            >
              Schließen
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
