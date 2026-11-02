import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/UserSidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const UserLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getPageTitle = (path: string) => {
    if (path.includes('new')) return 'New Investment';
    if (path.includes('investments')) return 'My Investments';
    if (path.includes('roi-growth')) return 'Active Growth & Daily ROI';
    if (path.includes('payout')) return 'Payouts & Withdrawals';
    if (path.includes('community')) return 'Community & Downline Tree';
    if (path.includes('profile')) return 'Investor Profile';
    if (path.includes('support')) return 'Institutional Support';
    return 'Portfolio Overview';
  };

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <UserSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full z-10">
            <UserSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-radial from-slate-900/30 to-[#070a12]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
