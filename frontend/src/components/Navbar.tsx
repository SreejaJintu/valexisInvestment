import React, { useState, useEffect } from 'react';
import { Menu, Bell, Wallet, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NotificationItem } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, title }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<NotificationItem[]>('/notification?limit=10');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch {
      // Ignore if unauthorized
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/notification/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  return (
    <header className="h-16 bg-[#090d18]/90 backdrop-blur-md border-b border-cyan-500/10 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-white tracking-wide">{title}</h1>
      </div>

      {/* Right: Wallet Balance Pill & Notifications & User Details */}
      <div className="flex items-center gap-3">
        {/* Withdrawable Balance Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/20 shadow-inner">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Withdrawable:</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            ${(user?.withdrawableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#090d18] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-[#0f172a] border border-cyan-500/20 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.notificationId} className={`py-2.5 px-2 ${!n.isRead ? 'bg-cyan-950/20 rounded-lg' : ''}`}>
                      <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            {user?.username?.substring(0, 1).toUpperCase() || 'V'}
          </div>
          <span className="hidden md:inline-block text-xs font-semibold text-slate-200">{user?.username}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </div>
      </div>
    </header>
  );
};
