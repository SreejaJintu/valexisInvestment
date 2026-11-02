import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { LedgerEntryDto } from '../../types';

export const AdminTransactions: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<LedgerEntryDto[]>('/admin/ledger');
      setEntries(res.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const typeColor: Record<string, string> = {
    DepositApproved: 'text-emerald-400',
    DailyRoi: 'text-cyan-400',
    ReferralCommission: 'text-indigo-400',
    SpotReward: 'text-purple-400',
    WithdrawalReserved: 'text-amber-400',
    WithdrawalPaid: 'text-rose-400',
    WithdrawalRefunded: 'text-slate-300',
    RankReward: 'text-amber-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Financial Transaction Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Immutable double-entry records for all platform financial events.</p>
        </div>
        <button onClick={fetch} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
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
                  <th className="px-4 py-3 text-left text-slate-400">ID</th>
                  <th className="px-4 py-3 text-left text-slate-400">Type</th>
                  <th className="px-4 py-3 text-left text-slate-400">Entry</th>
                  <th className="px-4 py-3 text-right text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-left text-slate-400">Balance Type</th>
                  <th className="px-4 py-3 text-right text-slate-400">Before</th>
                  <th className="px-4 py-3 text-right text-slate-400">After</th>
                  <th className="px-4 py-3 text-left text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500">No ledger entries yet.</td></tr>
                ) : entries.map(e => (
                  <tr key={e.ledgerId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">#{e.ledgerId}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${typeColor[e.transactionType] || 'text-slate-300'}`}>{e.transactionType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        e.entryType === 'Credit' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>{e.entryType}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">${e.amount.toFixed(4)}</td>
                    <td className="px-4 py-3 text-slate-400">{e.targetBalanceType}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">${e.balanceBefore.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">${e.balanceAfter.toFixed(4)}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</td>
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
