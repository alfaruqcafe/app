import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutGroup } from 'motion/react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { OrderStatus } from './pages/OrderStatus';
import { OrderHistory } from './pages/OrderHistory';
import { Events } from './pages/Events';
import { Booking } from './pages/Booking';
import { Login } from './pages/Login';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CashierDashboard } from './pages/CashierDashboard';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { AuthProvider } from './contexts/AuthContext';
import { MenuProvider } from './contexts/MenuContext';
import { AppModeProvider } from './contexts/AppModeContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <OrdersProvider>
          <MenuProvider>
            <AppModeProvider>
            <CartProvider>
            <BrowserRouter>
              {/* LayoutGroup bleibt über Routen-Wechsel hinweg bestehen, damit die
                  Speisekarte-Karte auf der Startseite in die Speisekarten-Ansicht
                  "hineinwachsen" kann (geteilte layoutId "menu-hero"). */}
              <LayoutGroup>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="events" element={<Events />} />
                  <Route path="events/:id" element={<Events />} />
                  <Route path="booking" element={<Booking />} />
                  <Route path="order/:id" element={<OrderStatus />} />
                  <Route path="history" element={<OrderHistory />} />
                  <Route path="login" element={<Login />} />

                  {/* Protected Routes (we can add wrappers later) */}
                  <Route path="staff" element={<StaffDashboard />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="cashier" element={<CashierDashboard />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
              </LayoutGroup>
            </BrowserRouter>
          </CartProvider>
            </AppModeProvider>
          </MenuProvider>
        </OrdersProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
