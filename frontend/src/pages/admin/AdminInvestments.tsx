import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, ShieldAlert, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { InvestmentDto } from '../../types';

export const AdminInvestments: React.FC = () => {
  const [investments, setInvestments] = useState<InvestmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Matured'>('All');

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<InvestmentDto[]>('/admin/investments');
      setInvestments(res.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvestments(); }, []);

  const filtered = filter === 'All' ? investments : investments.filter(i => i.status === filter);
  const totalPrincipal = investments.reduce((s, i) => s + i.principalAmount, 0);
  const totalRoi = investments.reduce((s, i) => s + i.totalRoiEarned, 0);
  const activeCount = investments.filter(i => i.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Investments Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">All active investment cycles, cap status, and maturity tracking.</p>
        </div>
        <button onClick={fetchInvestments} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400">Active Cycles</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">{activeCount}</p>
        </div>
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-cyan-500">
          <p className="text-xs text-slate-400">Total Locked Principal</p>
          <p className="text-xl font-bold font-mono text-cyan-400">${totalPrincipal.toFixed(2)}</p>
        </div>
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-indigo-500">
          <p className="text-xs text-slate-400">Total ROI Processed</p>
          <p className="text-xl font-bold font-mono text-indigo-400">${totalRoi.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['All', 'Active', 'Matured'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filter === f
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="valexis-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-slate-400">User</th>
                  <th className="px-4 py-3 text-right text-slate-400">Principal</th>
                  <th className="px-4 py-3 text-right text-slate-400">ROI Rate</th>
                  <th className="px-4 py-3 text-right text-slate-400">Earned</th>
                  <th className="px-4 py-3 text-right text-slate-400">Cap Target</th>
                  <th className="px-4 py-3 text-center text-slate-400">Progress</th>
                  <th className="px-4 py-3 text-center text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-slate-400">Started</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const pct = inv.maxEarningsCap > 0 ? Math.min(100, (inv.totalRoiEarned / inv.maxEarningsCap) * 100) : 0;
                  return (
                    <tr key={inv.investmentId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">@{inv.username}</p>
                        {inv.isTradeCapitalReward && <span className="text-[10px] text-purple-400">Trade Capital</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">${inv.principalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-400">{(inv.dailyRoiRate * 100).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">${inv.totalRoiEarned.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-indigo-400">${inv.maxEarningsCap.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-900 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`}
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 text-center mt-0.5">{pct.toFixed(1)}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}>
                          {inv.status === 'Active' ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <ShieldAlert className="w-3 h-3 inline mr-0.5" />}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
