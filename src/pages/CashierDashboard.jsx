import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Receipt, Search, CheckCircle2, XCircle, Clock, ChefHat, Check, User } from 'lucide-react';
import clsx from 'clsx';

export function CashierDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { orders, markOrderAsPaid } = useOrders();
  const [filter, setFilter] = useState('unpaid'); // 'unpaid', 'paid', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not cashier or admin
  if (!user || (user.role !== 'cashier' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-bold text-lg mb-4 text-[#3d1f0f]">Zugriff verweigert</p>
        <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-2.5 rounded-xl border-none cursor-pointer font-bold shadow-md shadow-primary/20">
          Zum Login
        </button>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by payment status
      if (filter === 'unpaid' && order.isPaid) return false;
      if (filter === 'paid' && !order.isPaid) return false;

      // 2. Filter by search term (table number or customer name)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesTable = String(order.tableNumber).toLowerCase().includes(term);
        const matchesName = order.customerName ? order.customerName.toLowerCase().includes(term) : false;
        return matchesTable || matchesName;
      }

      return true;
    });
  }, [orders, filter, searchTerm]);

  // Count helper functions
  const unpaidCount = useMemo(() => orders.filter(o => !o.isPaid).length, [orders]);
  const paidCount = useMemo(() => orders.filter(o => o.isPaid).length, [orders]);
  const totalCount = orders.length;

  const getStatusIconAndLabel = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Neu', className: 'bg-orange-50 text-orange-700 border-orange-100' };
      case 'preparing':
        return { icon: ChefHat, label: 'Zubereitung', className: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'ready':
        return { icon: CheckCircle2, label: 'Bereit', className: 'bg-green-50 text-green-700 border-green-100' };
      case 'delivered':
        return { icon: Check, label: 'Geliefert', className: 'bg-gray-150 text-gray-700 border-gray-200' };
      case 'cancelled':
        return { icon: XCircle, label: 'Storniert', className: 'bg-red-50 text-red-700 border-red-100' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-50 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col pb-12">
      {/* Header */}
      <div className="pt-12 px-6 pb-6 bg-grad text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="font-serif text-[24px] font-bold m-0 leading-tight">Kasse</h1>
          <p className="text-white/70 text-[12px] m-0">Bestellungen abkassieren & verwalten</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="border-none bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-all active:scale-95"
            title="Abmelden"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-[640px] mx-auto w-full box-border">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nach Tisch oder Name suchen..."
            className="w-full p-3.5 pl-11 rounded-2xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 bg-white shadow-sm transition-all"
          />
        </div>

        {/* Navigation / Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-200/50 p-1 rounded-2xl">
          <button
            onClick={() => setFilter('unpaid')}
            className={clsx(
              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5",
              filter === 'unpaid' ? "bg-white shadow-sm text-primary" : "text-gray-500 bg-transparent"
            )}
          >
            Offen
            <span className={clsx(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              filter === 'unpaid' ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
            )}>
              {unpaidCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={clsx(
              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5",
              filter === 'paid' ? "bg-white shadow-sm text-primary" : "text-gray-500 bg-transparent"
            )}
          >
            Bezahlt
            <span className={clsx(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              filter === 'paid' ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              {paidCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5",
              filter === 'all' ? "bg-white shadow-sm text-primary" : "text-gray-500 bg-transparent"
            )}
          >
            Alle
            <span className="px-1.5 py-0.5 rounded-full bg-gray-300 text-gray-600 text-[10px]">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-[#e5d9c8] p-8 shadow-sm">
            <Receipt size={48} className="mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="font-bold text-sm text-[#3d1f0f]">Keine Bestellungen gefunden</p>
            <p className="text-xs text-gray-400 mt-1">In dieser Kategorie liegen derzeit keine Bestellungen vor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map(order => {
              const statusInfo = getStatusIconAndLabel(order.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={order.id}
                  className={clsx(
                    "bg-white rounded-3xl p-5 shadow-sm border transition-all duration-300 flex flex-col gap-4",
                    order.isPaid ? "border-green-100" : "border-[#e5d9c8] hover:shadow-md"
                  )}
                >
                  {/* Order header info */}
                  <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#3d1f0f]">{order.tableNumber}</span>
                        {order.customerName && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                            <User size={10} />
                            {order.customerName}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-[11px] m-0 mt-1">
                        #{String(order.id).slice(-4)} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {/* Status badge */}
                      <span className={clsx("flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border", statusInfo.className)}>
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-[#3d1f0f]">
                          <span className="text-gray-400 font-bold mr-1">{item.quantity}x</span> {item.menuItemName}
                        </span>
                        <span className="text-gray-500 text-xs">{(item.price * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}

                    {order.note && (
                      <div className="mt-1 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        <strong>Notiz:</strong> {order.note}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 m-0 uppercase tracking-wider font-bold">Gesamtsumme</p>
                      <p className="text-xl font-bold text-primary m-0 mt-0.5">{order.totalPrice.toFixed(2)} €</p>
                    </div>

                    {order.isPaid ? (
                      <div className="bg-green-100 text-green-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                        <Check size={16} strokeWidth={2.5} />
                        Bezahlt
                      </div>
                    ) : (
                      <button
                        onClick={() => markOrderAsPaid(order.id)}
                        className="bg-primary hover:bg-primary-light text-white font-bold text-xs px-5 py-2.5 rounded-xl border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-primary/10 active:scale-95"
                      >
                        <Receipt size={16} />
                        Abkassieren
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
