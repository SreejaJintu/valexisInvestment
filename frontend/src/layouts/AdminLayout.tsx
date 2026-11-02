import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/portfolio" replace />;
  }

  const getAdminTitle = (path: string) => {
    if (path.includes('users')) return 'User Registry & Balances';
    if (path.includes('investment-requests')) return 'Deposit Verification Queue';
    if (path.includes('investments')) return 'Active Portfolios & Maturity';
    if (path.includes('roi-settings')) return 'Daily ROI Rate & Multipliers';
    if (path.includes('referral-settings')) return '5-Level Commission Structure';
    if (path.includes('spot-settings')) return 'Spot Reward Configuration';
    if (path.includes('withdrawals')) return 'Withdrawal Approvals';
    if (path.includes('ranks')) return 'Rank Qualification Tiers (R1 - R8)';
    if (path.includes('rank-rewards')) return 'Trade Capital Claims';
    if (path.includes('transactions')) return 'Financial Transaction Ledger';
    if (path.includes('reports')) return 'Financial Health & Reports';
    if (path.includes('audit-logs')) return 'Security Audit Trail';
    return 'Admin Terminal Overview';
  };

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full z-10">
            <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} title={getAdminTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-radial from-slate-900/30 to-[#070a12]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
