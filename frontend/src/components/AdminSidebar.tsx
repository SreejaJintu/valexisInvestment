import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Briefcase,
  Sliders,
  Share2,
  Gift,
  ArrowDownToLine,
  Award,
  Crown,
  Receipt,
  BarChart3,
  ScrollText,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Investment Requests', path: '/admin/investment-requests', icon: Clock },
    { name: 'Investments', path: '/admin/investments', icon: Briefcase },
    { name: 'ROI Settings', path: '/admin/roi-settings', icon: Sliders },
    { name: 'Referral Settings', path: '/admin/referral-settings', icon: Share2 },
    { name: 'Spot Reward Settings', path: '/admin/spot-settings', icon: Gift },
    { name: 'Withdrawal Requests', path: '/admin/withdrawals', icon: ArrowDownToLine },
    { name: 'Rank Management', path: '/admin/ranks', icon: Award },
    { name: 'Rank Rewards', path: '/admin/rank-rewards', icon: Crown },
    { name: 'Transactions', path: '/admin/transactions', icon: Receipt },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  ];

  return (
    <aside className="w-64 bg-[#080b14] border-r border-indigo-500/15 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-indigo-500/15 bg-[#0b101e]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-white">VALEXIS</span>
            <span className="block text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Admin Terminal</span>
          </div>
        </div>
      </div>

      {/* Switch to Investor Dashboard */}
      <div className="px-3 pt-3">
        <NavLink
          to="/portfolio"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 hover:bg-cyan-900/40"
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Go to Investor Portal</span>
        </NavLink>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-400" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-indigo-500/15">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
