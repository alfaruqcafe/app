import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen relative shadow-2xl overflow-x-hidden">
        <Outlet />
        <BottomNav />
      </div>
    </div>
  );
}
