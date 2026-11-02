import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Briefcase, 
  ArrowDownToLine, 
  TrendingUp, 
  ShieldCheck, 
  Database,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 1,
    pendingRequests: 0,
    activeInvestments: 0,
    pendingWithdrawals: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // Can be expanded as more modules come online
        const res = await api.get('/admin/overview');
        setStats(res.data);
      } catch {
        // Fallback default
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="valexis-card rounded-2xl p-6 border-l-4 border-l-indigo-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Root Terminal
            </span>
            <span className="text-xs text-slate-400">Database: Microsoft SQL Server (LocalDB)</span>
          </div>
          <h2 className="text-2xl font-black text-white">System Administration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log, deposit approvals, withdrawal disbursements, and rank engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/investment-requests"
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center gap-2 transition-colors"
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="valexis-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Registered Investors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stats.totalUsers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active platform accounts</p>
        </div>

        <div className="valexis-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Deposits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{stats.pendingRequests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting blockchain verification</p>
        </div>

        <div className="valexis-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Active Investments</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{stats.activeInvestments}</div>
          <p className="text-[11px] text-slate-500 mt-1">Earning daily ROI yields</p>
        </div>

        <div className="valexis-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Payouts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">{stats.pendingWithdrawals}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending admin confirmation</p>
        </div>
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="valexis-card rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">Core Platform Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/investment-requests"
            className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300">Investment Workflow</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm font-bold text-white">Deposit Verification Queue</p>
            <p className="text-xs text-slate-400 mt-1">Verify TX hashes and approve locked principals.</p>
          </Link>

          <Link
            to="/admin/roi-settings"
            className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300">Yield Management</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm font-bold text-white">ROI & 3x Cap Settings</p>
            <p className="text-xs text-slate-400 mt-1">Configure daily rates, caps, and execution hours.</p>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300">Compliance</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm font-bold text-white">Financial Ledger & Audit</p>
            <p className="text-xs text-slate-400 mt-1">Inspect double-entry ledger transactions and audit logs.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
