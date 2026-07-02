import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, ChevronRight } from 'lucide-react';
import { useOrders } from '../contexts/OrdersContext';
import { STATUS_LABELS, STATUS_COLORS } from '../lib/orderStatus';

export function OrderHistory() {
  const navigate = useNavigate();
  const { orders } = useOrders();

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  const total = useMemo(
    () => orders.reduce((s, o) => s + (o.totalPrice || 0), 0),
    [orders]
  );

  return (
    <div className="pb-24 bg-[#fdfbf7] min-h-screen">
      {/* Header */}
      <div className="pt-12 px-4 pb-6 bg-grad flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="bg-white/10 border-none text-white w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white m-0">Bestellhistorie</h1>
          <p className="text-white/70 text-xs m-0">Alle deine Bestellungen</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Gesamtsumme */}
        {orders.length > 0 && (
          <div className="bg-white border border-[#e5d9c8] rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <span className="font-bold text-[#3d1f0f]">Gesamtsumme</span>
            <span className="font-bold text-xl text-primary">{total.toFixed(2)} €</span>
          </div>
        )}

        {sortedOrders.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-grad text-white flex items-center justify-center shadow-2xl shadow-primary/30 mb-6">
              <Receipt size={40} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#3d1f0f] mb-2">Noch keine Bestellungen</h2>
            <p className="text-gray-500 max-w-[260px] leading-relaxed">
              Deine aufgegebenen Bestellungen erscheinen hier.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedOrders.map(order => {
              const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="w-full bg-white border border-[#e5d9c8] rounded-2xl p-4 flex justify-between items-center cursor-pointer text-left shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm m-0 text-[#3d1f0f]">Bestellung #{String(order.id).slice(-4)}</p>
                    <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' · '}
                      {new Date(order.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span
                      className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.color }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="font-bold text-lg text-primary">{order.totalPrice?.toFixed(2) || "0.00"} €</span>
                    <ChevronRight size={18} className="text-primary/50" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
