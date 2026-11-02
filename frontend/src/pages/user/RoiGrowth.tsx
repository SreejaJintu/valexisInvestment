import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { DailyRoiTransactionDto } from '../../types';

export const RoiGrowth: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DailyRoiTransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoi = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<DailyRoiTransactionDto[]>('/roi/my-transactions');
      setTransactions(res.data);
    } catch {
      setError('Could not load ROI transactions. The ROI engine may not have run yet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoi(); }, []);

  const totalEarned = transactions.filter(t => t.status === 'Processed').reduce((s, t) => s + t.roiAmount, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoi = transactions.find(t => t.calculationDate === todayStr && t.status === 'Processed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Active Investment Growth</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Daily ROI credited at 0.8% of locked principal per active investment.</p>
        </div>
        <button onClick={fetchRoi} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="valexis-card rounded-2xl p-5 border-t-4 border-t-emerald-500">
          <p className="text-xs text-slate-400">Active Investment Growth</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">${(user?.activeGrowth ?? 0).toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cumulative verified ROI</p>
        </div>
        <div className="valexis-card rounded-2xl p-5 border-t-4 border-t-cyan-500">
          <p className="text-xs text-slate-400">Today's ROI</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {todayRoi ? `+$${todayRoi.roiAmount.toFixed(2)}` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{todayRoi ? 'Processed today' : 'Pending next cycle'}</p>
        </div>
        <div className="valexis-card rounded-2xl p-5 border-t-4 border-t-indigo-500">
          <p className="text-xs text-slate-400">Total from History</p>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">${totalEarned.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{transactions.length} processed records</p>
        </div>
      </div>

      {/* Info panel */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-cyan-300">
        <BarChart2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
        <span>
          ROI is calculated once daily by the backend scheduler (default: midnight UTC) on all active investments independently.
          Each investment matures when its total ROI earnings reach the configured cap (3x principal).
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Table */}
      <div className="valexis-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Daily ROI Transaction History</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No ROI transactions yet.</p>
            <p className="text-xs text-slate-500 mt-1">ROI is processed daily after investment approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Investment ID</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Principal</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">ROI Rate</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">ROI Credited</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.dailyRoiId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-300">{tx.calculationDate}</td>
                    <td className="px-4 py-3 text-slate-400">#{tx.investmentId}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">${tx.principalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-400">{(tx.roiRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">+${tx.roiAmount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tx.status === 'Processed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
