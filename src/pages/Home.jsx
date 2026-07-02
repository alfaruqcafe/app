import { useNavigate } from 'react-router-dom';
import { Coffee, Receipt, Sparkles, ChevronRight, Bell, Clock } from 'lucide-react';
import { useOrders } from '../contexts/OrdersContext';
import { STATUS_LABELS } from '../lib/orderStatus';

export function Home() {
  const navigate = useNavigate();
  const { activeOrders } = useOrders();

  const quickActions = [
    { path: "/menu", icon: Coffee, label: "Speisekarte", desc: "Unsere Angebote" },
    { path: "/history", icon: Receipt, label: "Bestellhistorie", desc: "Deine Bestellungen" },
  ];

  return (
    <div className="pb-28 bg-[#fdfbf7] min-h-screen">
      {/* Hero */}
      <div className="bg-grad-hero flex flex-col items-center pt-14 px-8 pb-10">
        <div className="w-32 h-32 mb-4 p-2 bg-white/40 backdrop-blur-md rounded-3xl flex items-center justify-center drop-shadow-[0_8px_24px_rgba(60,20,5,0.2)]">
          <img src="/cafe-logo.png" alt="Café Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-[11px] font-bold tracking-[3px] uppercase text-[#6b3520] mb-1.5">Café in der Moschee</p>
        <p className="text-[13px] italic text-[#7c4b2a] opacity-85 text-center leading-relaxed">
          "Jeder Kauf unterstützt Moschee, Schule und Jugend."
        </p>
      </div>

      {/* Active Order Banners */}
      {activeOrders.length > 0 && (
        <div className="px-4 -mt-4 mb-4 relative z-10 flex flex-col gap-2">
          {activeOrders.map(order => (
            <button
              key={order.id}
              onClick={() => navigate(`/order/${order.id}`)}
              className="w-full bg-white border-2 border-primary/20 rounded-2xl p-4 flex justify-between items-center cursor-pointer shadow-lg shadow-primary/5 transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Clock size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[13px] text-primary m-0">Bestellung #{String(order.id).slice(-4)}</p>
                  <p className="text-[11px] text-gray-500 m-0 mt-0.5">{STATUS_LABELS[order.status] || order.status}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-primary/50" />
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 bg-[#fdfbf7]">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white border border-[#e5d9c8] rounded-2xl p-4 cursor-pointer text-left flex flex-col gap-2 shadow-sm transition-transform active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-[13px] text-[#3d1f0f] m-0">{action.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 m-0">{action.desc}</p>
                </div>
              </button>
            );
          })}
          <div className="bg-white border border-[#e5d9c8] rounded-2xl p-4 text-left flex flex-col gap-2 shadow-sm opacity-40 cursor-not-allowed col-span-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-bold text-[13px] text-[#3d1f0f] m-0">Bald verfügbar</p>
              <p className="text-[11px] text-gray-400 mt-0.5 m-0">Weitere Funktionen folgen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Push Notification Banner */}
      <div className="px-4 pb-4">
        <button
          onClick={async () => {
            try {
              const { subscribeToPushNotifications } = await import('../lib/push');
              await subscribeToPushNotifications(null, 'customer');
              alert("Push-Benachrichtigungen aktiviert! Du wirst über neue Events und Speisekarten-Änderungen informiert.");
            } catch (e) {
              if (e.message?.includes('nicht unterstützt')) {
                alert("Um Push-Benachrichtigungen auf dem iPhone zu erhalten, musst du diese Seite zuerst als App installieren:\n\n1. Tippe auf das Teilen-Symbol (□↑) unten in Safari\n2. Wähle 'Zum Home-Bildschirm'\n3. Öffne die App vom Home-Bildschirm\n4. Dann kannst du Benachrichtigungen aktivieren!");
              } else {
                alert(e.message || "Fehler beim Aktivieren der Benachrichtigungen.");
              }
            }
          }}
          className="w-full bg-gradient-to-r from-primary to-primary-light text-white border-none rounded-2xl p-4 flex items-center gap-3 cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell size={20} />
          </div>
          <div className="text-left">
            <p className="font-bold text-[13px] m-0">Benachrichtigungen aktivieren</p>
            <p className="text-[11px] text-white/70 m-0 mt-0.5">Erhalte Updates zur Speisekarte</p>
          </div>
        </button>
      </div>

      {/* Staff Link */}
      <div className="text-center py-2 pb-6">
        <button
          onClick={() => navigate('/login')}
          className="border-none bg-transparent text-[11px] text-gray-400/60 cursor-pointer hover:text-primary transition-colors"
        >
          Mitarbeiter-Bereich
        </button>
      </div>
    </div>
  );
}
