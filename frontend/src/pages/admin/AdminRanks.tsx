import React, { useState, useEffect } from 'react';
import { Crown, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { RankSettingDto } from '../../types';

export const AdminRanks: React.FC = () => {
  const [ranks, setRanks] = useState<RankSettingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get<RankSettingDto[]>('/admin/ranks');
        setRanks(res.data);
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          R1–R8 Rank Qualification Management
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Rank thresholds and Trade Capital reward amounts. Modify via SQL or future admin UI.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ranks.map((r, i) => (
            <div key={r.rankId} className="valexis-card rounded-2xl p-5 border-t-4" style={{ borderTopColor: ['#06b6d4','#10b981','#6366f1','#f59e0b','#ec4899','#8b5cf6','#ef4444','#14b8a6'][i] ?? '#06b6d4' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-black text-white">{r.rankCode}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">Active</span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mb-4">{r.rankName}</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Self Investment</span>
                  <span className="font-mono text-white">${r.requiredSelfInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Team Business</span>
                  <span className="font-mono text-white">${r.requiredTeamBusiness.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Leaders Needed</span>
                  <span className="font-mono text-white">{r.requiredLeadersCount}</span>
                </div>
              </div>
              <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-emerald-400 font-semibold">Trade Capital Reward</p>
                <p className="text-base font-bold font-mono text-emerald-300">${r.tradeCapitalReward.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
