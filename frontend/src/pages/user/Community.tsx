import React, { useState, useEffect } from 'react';
import { Users, Star, Gift, TrendingUp, RefreshCw, Copy, Check, Crown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ReferralMemberDto, SpotRewardDto, ReferralCommissionDto, RankSettingDto } from '../../types';

type Tab = 'downline' | 'spot' | 'commissions' | 'ranks';

export const Community: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('downline');
  const [members, setMembers] = useState<ReferralMemberDto[]>([]);
  const [spotRewards, setSpotRewards] = useState<SpotRewardDto[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommissionDto[]>([]);
  const [ranks, setRanks] = useState<RankSettingDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode ?? ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTab = async (t: Tab) => {
    setIsLoading(true);
    try {
      if (t === 'downline') {
        const res = await api.get<ReferralMemberDto[]>('/community/referrals');
        setMembers(res.data);
      } else if (t === 'spot') {
        const res = await api.get<SpotRewardDto[]>('/community/spot-rewards');
        setSpotRewards(res.data);
      } else if (t === 'commissions') {
        const res = await api.get<ReferralCommissionDto[]>('/community/commissions');
        setCommissions(res.data);
      } else if (t === 'ranks') {
        const res = await api.get<RankSettingDto[]>('/community/ranks');
        setRanks(res.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTab(tab); }, [tab]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'downline', label: 'My Downline', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'spot', label: 'Spot Rewards', icon: <Gift className="w-3.5 h-3.5" /> },
    { key: 'commissions', label: 'Commissions', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'ranks', label: 'R1–R8 Ranks', icon: <Crown className="w-3.5 h-3.5" /> },
  ];

  const levelColors = ['', 'text-cyan-400', 'text-emerald-400', 'text-indigo-400', 'text-amber-400', 'text-purple-400'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span>Community & Referral</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">5-level referral commissions, spot rewards, and R1–R8 rank progress.</p>
      </div>

      {/* Referral link box */}
      <div className="valexis-card rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Referral Link</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 truncate">
            {referralLink}
          </code>
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span>Code: <span className="font-mono text-cyan-300 font-semibold">{user?.referralCode}</span></span>
          <span>Rank: <span className="text-amber-300 font-semibold">{user?.currentRank ?? 'Unranked'}</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Downline */}
          {tab === 'downline' && (
            <div className="valexis-card rounded-2xl overflow-hidden">
              {members.length === 0 ? (
                <div className="py-14 text-center">
                  <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No referrals yet. Share your link to grow your team!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left text-slate-400">Level</th>
                        <th className="px-4 py-3 text-left text-slate-400">Username</th>
                        <th className="px-4 py-3 text-left text-slate-400">Email</th>
                        <th className="px-4 py-3 text-left text-slate-400">Rank</th>
                        <th className="px-4 py-3 text-right text-slate-400">Total Invested</th>
                        <th className="px-4 py-3 text-left text-slate-400">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.userId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`font-bold ${levelColors[m.level] || 'text-slate-400'}`}>L{m.level}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">@{m.username}</td>
                          <td className="px-4 py-3 text-slate-400">{m.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                              {m.currentRank ?? 'Unranked'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-cyan-400">${m.totalInvested.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Spot Rewards */}
          {tab === 'spot' && (
            <div className="valexis-card rounded-2xl overflow-hidden">
              {spotRewards.length === 0 ? (
                <div className="py-14 text-center">
                  <Gift className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No spot rewards yet. Referral spot rewards are credited when a referred user's deposit is approved.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left text-slate-400">Source User</th>
                        <th className="px-4 py-3 text-right text-slate-400">Deposit Amount</th>
                        <th className="px-4 py-3 text-right text-slate-400">Rate</th>
                        <th className="px-4 py-3 text-right text-slate-400">Spot Reward</th>
                        <th className="px-4 py-3 text-left text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spotRewards.map(r => (
                        <tr key={r.spotRewardId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-white font-semibold">@{r.sourceUsername}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">${r.baseInvestmentAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-cyan-400">{(r.spotRate * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">+${r.rewardAmount.toFixed(4)}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Commissions */}
          {tab === 'commissions' && (
            <div className="valexis-card rounded-2xl overflow-hidden">
              {commissions.length === 0 ? (
                <div className="py-14 text-center">
                  <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No referral commissions yet. Commissions are calculated from downline daily ROI.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left text-slate-400">Source</th>
                        <th className="px-4 py-3 text-left text-slate-400">Level</th>
                        <th className="px-4 py-3 text-right text-slate-400">Downline ROI</th>
                        <th className="px-4 py-3 text-right text-slate-400">Rate</th>
                        <th className="px-4 py-3 text-right text-slate-400">Commission</th>
                        <th className="px-4 py-3 text-left text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map(c => (
                        <tr key={c.commissionId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">@{c.sourceUsername}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${levelColors[c.level] || 'text-slate-400'}`}>L{c.level}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">${c.baseDailyRoiAmount.toFixed(4)}</td>
                          <td className="px-4 py-3 text-right font-mono text-cyan-400">{(c.commissionRate * 100).toFixed(0)}%</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">+${c.commissionAmount.toFixed(4)}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Ranks */}
          {tab === 'ranks' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ranks.map(r => {
                const isCurrent = user?.currentRank === r.rankCode;
                return (
                  <div key={r.rankId} className={`valexis-card rounded-2xl p-5 border-t-4 transition-all ${isCurrent ? 'border-t-amber-400 ring-1 ring-amber-400/20' : 'border-t-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-lg font-bold ${isCurrent ? 'text-amber-400' : 'text-slate-300'}`}>{r.rankCode}</span>
                      {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Current</span>}
                    </div>
                    <p className="text-xs font-semibold text-slate-300 mb-3">{r.rankName}</p>
                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Self Investment</span>
                        <span className="font-mono text-slate-300">${r.requiredSelfInvestment.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team Business</span>
                        <span className="font-mono text-slate-300">${r.requiredTeamBusiness.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leaders Needed</span>
                        <span className="font-mono text-slate-300">{r.requiredLeadersCount}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center">
                      <p className="text-[10px] text-emerald-400 font-semibold">Trade Capital Reward</p>
                      <p className="text-sm font-bold font-mono text-emerald-300">${r.tradeCapitalReward.toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
