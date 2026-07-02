import { NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Home, Coffee, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export function BottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  const canOrder = user?.role === 'staff' || user?.role === 'admin';

  // Hide nav for staff/admin entirely, or on specific routes
  if (canOrder || location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin') || location.pathname === '/login') {
    return null;
  }

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/menu", icon: Coffee, label: "Speisekarte" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5d9c8] flex justify-around items-center z-[100] max-w-[480px] mx-auto pb-safe" style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer py-2 px-1 relative"
          >
            <div className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isActive ? "bg-primary text-white" : "bg-transparent text-gray-500"
            )}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={clsx(
              "text-[10px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-gray-400"
            )}>
              {item.label}
            </span>

            {item.to === "/menu" && count > 0 && (
              <span className="absolute top-1 right-[25%] bg-red-600 text-white rounded-full w-4 h-4 text-[10px] font-extrabold flex items-center justify-center">
                {count}
              </span>
            )}
          </NavLink>
        );
      })}

      {/* Coming Soon: weitere Funktionen folgen */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 opacity-40 pointer-events-none cursor-not-allowed">
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent text-gray-500">
          <Sparkles size={20} strokeWidth={2} />
        </div>
        <span className="text-[10px] font-semibold text-gray-400">Bald verfügbar</span>
      </div>
    </nav>
  );
}
