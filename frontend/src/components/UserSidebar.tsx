import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Briefcase, 
  TrendingUp, 
  Wallet, 
  Users2, 
  UserCircle, 
  HelpCircle,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const UserSidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Portfolio', path: '/portfolio', icon: LayoutDashboard },
    { name: 'New Investment', path: '/investment/new', icon: PlusCircle },
    { name: 'My Investments', path: '/investments', icon: Briefcase },
    { name: 'Return On Investment', path: '/roi-growth', icon: TrendingUp },
    { name: 'Payout', path: '/payout', icon: Wallet },
    { name: 'Community', path: '/community', icon: Users2 },
    { name: 'Profile', path: '/profile', icon: UserCircle },
    { name: 'Support', path: '/support', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-[#090d18] border-r border-cyan-500/10 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-cyan-500/10 bg-[#0d1322]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            V
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-white">VALEXIS</span>
            <span className="block text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">Wealth Engine</span>
          </div>
        </div>
      </div>

      {/* User Quick Info */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-semibold text-sm">
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">{user?.username}</p>
            <p className="text-xs text-cyan-400 font-mono">{user?.currentRank || 'Standard Tier'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Switch to Admin if user has Admin role */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <NavLink
              to="/admin"
              onClick={onCloseMobile}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-indigo-400 bg-indigo-950/30 border border-indigo-500/20 hover:bg-indigo-900/40"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Admin Terminal</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-cyan-500/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
