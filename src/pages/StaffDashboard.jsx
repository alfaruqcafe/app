import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, CheckCircle2, Clock, ChefHat, PartyPopper } from 'lucide-react';
import clsx from 'clsx';

export function StaffDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [filter, setFilter] = useState('active'); // 'active', 'all'

  // Redirect if not logged in
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-bold mb-4">Zugriff verweigert</p>
        <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-2 rounded-xl">Zum Login</button>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12}/> Neu</span>;
      case 'preparing': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><ChefHat size={12}/> Zubereitung</span>;
      case 'ready': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Bereit</span>;
      case 'delivered': return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><PartyPopper size={12}/> Erledigt</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">Storniert</span>;
      default: return null;
    }
  };

  const advanceStatus = (order) => {
    if (order.status === 'pending') updateOrderStatus(order.id, 'preparing');
    else if (order.status === 'preparing') updateOrderStatus(order.id, 'ready');
    else if (order.status === 'ready') updateOrderStatus(order.id, 'delivered');
  };

  const revertStatus = (order) => {
    if (order.status === 'preparing') updateOrderStatus(order.id, 'pending');
    else if (order.status === 'ready') updateOrderStatus(order.id, 'preparing');
    else if (order.status === 'delivered') updateOrderStatus(order.id, 'ready');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
      <div className="bg-grad text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-serif text-xl font-bold m-0">Staff Dashboard</h1>
          <p className="text-white/70 text-xs m-0">Eingeloggt als {user.username}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-white/10 hover:bg-white/20 border-none w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <button 
            onClick={() => navigate('/menu')}
            className="w-full py-3.5 bg-grad text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="text-xl leading-none">+</span> Neue Bestellung aufnehmen
          </button>
        </div>

        <div className="flex gap-2 mb-4 bg-gray-200/50 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('active')}
            className={clsx(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
              filter === 'active' ? "bg-white shadow-sm text-primary" : "text-gray-500"
            )}
          >
            Aktive ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={clsx(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
              filter === 'all' ? "bg-white shadow-sm text-primary" : "text-gray-500"
            )}
          >
            Alle ({orders.length})
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-medium">
            Keine Bestellungen vorhanden.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5d9c8]">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-lg m-0 leading-tight flex items-center gap-2">
                      <MapPin size={14} />
                      {order.tableNumber}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 m-0">
                      #{order.id.toString().slice(-4)} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {order.customerName ? ` • ${order.customerName}` : ''}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium"><span className="text-gray-400 font-bold mr-1">{item.quantity}x</span> {item.menuItemName}</span>
                    </div>
                  ))}
                  {order.note && (
                    <div className="mt-2 text-xs text-orange-800 bg-orange-50 p-2 rounded border border-orange-100">
                      <strong>Notiz:</strong> {order.note}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {order.status !== 'pending' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => revertStatus(order)}
                      className="px-3 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl active:scale-95 transition-transform cursor-pointer"
                      title="Status zurücksetzen"
                    >
                      Zurück
                    </button>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button 
                      onClick={() => advanceStatus(order)}
                      className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
                    >
                      {order.status === 'pending' ? 'Starten' : order.status === 'preparing' ? 'Fertigstellen' : 'Ausliefern'}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl active:scale-95 transition-transform cursor-pointer"
                    >
                      Storno
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
