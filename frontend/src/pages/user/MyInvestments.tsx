import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, ShieldAlert, Clock, CheckCircle2, Info } from 'lucide-react';
import api from '../../services/api';
import type { InvestmentDto } from '../../types';

export const MyInvestments: React.FC = () => {
  const [investments, setInvestments] = useState<InvestmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const res = await api.get<InvestmentDto[]>('/investments/my-investments');
        setInvestments(res.data);
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestments();
  }, []);

  const activeCount = investments.filter((i) => i.status === 'Active').length;
  const maturedCount = investments.filter((i) => i.status === 'Matured').length;
  const totalPrincipal = investments.reduce((sum, i) => sum + i.principalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-400" />
          <span>My Investment Portfolios</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Each investment runs independently with its own 3x earnings cap cycle.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400">Active Cycles</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-slate-500">
          <span className="text-xs text-slate-400">Matured Cycles</span>
          <p className="text-2xl font-bold font-mono text-slate-300 mt-1">{maturedCount}</p>
        </div>
        <div className="valexis-card rounded-2xl p-4 border-l-4 border-l-cyan-500">
          <span className="text-xs text-slate-400">Total Locked Principal</span>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">${totalPrincipal.toFixed(2)}</p>
        </div>
      </div>

      {/* Investment Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <div className="valexis-card rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-300 mb-1">No Active Investments Yet</h3>
          <p className="text-xs text-slate-500">Submit a crypto deposit request to activate your first investment cycle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => {
            const capPct = inv.maxEarningsCap > 0 ? Math.min(100, (inv.totalRoiEarned / inv.maxEarningsCap) * 100) : 0;
            return (
              <div key={inv.investmentId} className="valexis-card rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      inv.status === 'Active'
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}>
                      {inv.status === 'Active' ? <TrendingUp className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Investment #{inv.investmentId}
                        {inv.isTradeCapitalReward && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300">
                            Trade Capital
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        Started: {new Date(inv.createdAt).toLocaleDateString()}
                        {inv.maturedAt && ` • Matured: ${new Date(inv.maturedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold self-start md:self-auto ${
                    inv.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : inv.status === 'Matured'
                      ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Principal</span>
                    <span className="text-sm font-mono font-bold text-white">${inv.principalAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Daily ROI Rate</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{(inv.dailyRoiRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total ROI Earned</span>
                    <span className="text-sm font-mono font-bold text-cyan-400">${inv.totalRoiEarned.toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">3x Cap Target</span>
                    <span className="text-sm font-mono font-bold text-indigo-400">${inv.maxEarningsCap.toFixed(2)}</span>
                  </div>
                </div>

                {/* Cap Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Cap Progress ({inv.capMultiplier}x)</span>
                    <span className={capPct >= 100 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {capPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        capPct >= 100
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(3, capPct)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ${inv.totalRoiEarned.toFixed(2)} earned of ${inv.maxEarningsCap.toFixed(2)} cap
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
        <span>
          Each investment cycle is fully independent. Daily ROI stops when an individual investment reaches its configured 3x cap. Referral tree and relationships are preserved after maturity.
        </span>
      </div>
    </div>
  );
};
