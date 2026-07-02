import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Clock, ChefHat, CheckCircle2, PartyPopper } from 'lucide-react';
import clsx from 'clsx';
import { ORDER_STATUS_STEPS, STATUS_LABELS } from '../lib/orderStatus';

export function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder } = useOrders();
  const { user } = useAuth();
  const order = getOrder(id);

  const steps = ORDER_STATUS_STEPS;
  const STATUS_ICONS = {
    pending: Clock, 
    preparing: ChefHat, 
    ready: CheckCircle2, 
    delivered: PartyPopper 
  };

  const backPath = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/menu';

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fdfbf7]">
        <div className="text-5xl">❓</div>
        <p className="font-bold">Bestellung nicht gefunden</p>
        <button 
          onClick={() => navigate(backPath)} 
          className="px-6 py-3 rounded-xl bg-grad text-white border-none font-bold cursor-pointer"
        >
          Zurück
        </button>
      </div>
    );
  }

  const currentStepIndex = order.status === "cancelled" ? -1 : steps.indexOf(order.status);

  return (
    <div className="pb-24 bg-[#fdfbf7] min-h-screen">
      {/* Header */}
      <div className="pt-12 px-4 pb-6 bg-grad flex items-center gap-3">
        <button 
          onClick={() => navigate(backPath)}
          className="bg-white/10 border-none text-white w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white m-0">Bestellung #{order.id.toString().slice(-4)}</h1>
          <p className="text-white/70 text-xs m-0">
            Tisch {order.tableNumber}{order.customerName ? ` · ${order.customerName}` : ""}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Status Timeline */}
        <div className="bg-white border border-[#e5d9c8] rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[15px] mb-5">Status</h2>
          {steps.map((step, index) => {
            const isCompleted = currentStepIndex >= index;
            const isCurrent = currentStepIndex === index;
            const isLast = index === steps.length - 1;
            const Icon = STATUS_ICONS[step];

            return (
              <div key={step} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className={clsx(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCompleted ? "border-primary bg-primary text-white" : "border-[#e5d9c8] bg-white text-gray-300",
                    isCurrent && "ring-4 ring-primary/15"
                  )}>
                    <Icon size={18} strokeWidth={isCompleted ? 2.5 : 2} />
                  </div>
                  {!isLast && (
                    <div className={clsx(
                      "w-0.5 h-8 mt-1",
                      isCompleted ? "bg-primary/30" : "bg-[#e5d9c8]"
                    )} />
                  )}
                </div>
                <div className="pt-2.5 pb-4">
                  <p className={clsx(
                    "font-bold text-sm m-0 transition-colors",
                    isCompleted ? "text-[#3d1f0f]" : "text-gray-400"
                  )}>
                    {STATUS_LABELS[step]}
                  </p>
                </div>
              </div>
            );
          })}
          
          {order.status === "cancelled" && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-center text-red-700 font-bold text-sm">
              Bestellung storniert
            </div>
          )}
        </div>

        {/* Zusammenfassung */}
        <div className="bg-white border border-[#e5d9c8] rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[15px] mb-4">Zusammenfassung</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-gray-500">{item.quantity}×</span>
                  <span className="font-medium text-[#3d1f0f]">{item.menuItemName || "Artikel"}</span>
                </div>
              </div>
            ))}
            
            {order.note && (
              <div className="mt-2 p-3 bg-[#fafaf8] rounded-xl border border-[#e5d9c8] text-sm text-gray-600">
                <span className="font-bold block text-xs text-gray-400 uppercase tracking-wider mb-1">Notiz</span>
                {order.note}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t border-[#e5d9c8] mt-1">
              <span className="font-bold">Gesamt</span>
              <span className="font-bold text-primary text-base">{order.totalPrice?.toFixed(2) || "0.00"} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
