import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Lock, 
  TrendingUp, 
  Gift, 
  Users2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Crown,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Financial Balances (Real API state from user profile)
  const lockedPrincipal = user?.lockedPrincipal || 0;
  const activeGrowth = user?.activeGrowth || 0;
  const spotRewards = user?.spotRewards || 0;
  const referralCommissions = user?.referralCommissions || 0;
  const withdrawableBalance = user?.withdrawableBalance || 0;
  const totalWithdrawn = user?.totalWithdrawn || 0;

  // 3x Cap Calculations
  const maxCapTarget = lockedPrincipal * 3.0;
  const totalAccrued = activeGrowth + referralCommissions + spotRewards;
  const capProgressPct = maxCapTarget > 0 ? Math.min(100, (totalAccrued / maxCapTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Welcome & Quick Action Bar */}
      <div className="valexis-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {user?.currentRank || 'Standard Member'}
            </span>
            <span className="text-xs text-slate-400">Institutional ID: #{user?.userId}</span>
          </div>
          <h2 className="text-2xl font-black text-white">Welcome back, {user?.username}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time portfolio metrics, yields, and growth capitalization.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/investment/new"
            className="valexis-gradient-btn px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>New Investment</span>
          </Link>
          <Link
            to="/payout"
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Request Payout</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards (5 Core Balances) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Locked Principal */}
        <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Locked Principal</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${lockedPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active capital earning 0.8% daily</p>
        </div>

        {/* Card 2: Active Growth (Daily ROI) */}
        <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Active Growth (ROI)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${activeGrowth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Accrued daily yield ledger</p>
        </div>

        {/* Card 3: Spot Rewards */}
        <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Spot Rewards</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            ${spotRewards.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Separate deposit spot bonuses</p>
        </div>

        {/* Card 4: Referral Commissions */}
        <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">5-Tier Commissions</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-blue-300">
            ${referralCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Downline daily ROI yield</p>
        </div>

        {/* Card 5: Withdrawable Balance */}
        <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-teal-400 bg-teal-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-300">Withdrawable Balance</span>
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-teal-300">
            ${withdrawableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Available for payout</p>
        </div>
      </div>

      {/* Middle Section: 3x Investment Cap & Rank Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3x Cap Multiplier Ring */}
        <div className="valexis-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>3x Investment Cap Multiplier</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20">
                  Target: 300%
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every approved investment runs an independent cycle until reaching 3x of its principal.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Accrued</span>
              <p className="text-base font-mono font-bold text-cyan-300">
                ${totalAccrued.toFixed(2)} / ${maxCapTarget.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(3, capProgressPct)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Progress: {capProgressPct.toFixed(1)}%</span>
            <span>
              {capProgressPct >= 100 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Investment Cycle Matured
                </span>
              ) : (
                `Remaining to 3x cap: $${Math.max(0, maxCapTarget - totalAccrued).toFixed(2)} USDT`
              )}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[11px] text-slate-400">Total Withdrawn</span>
              <p className="text-sm font-mono font-semibold text-slate-200 mt-0.5">
                ${totalWithdrawn.toFixed(2)} USDT
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[11px] text-slate-400">Cap Multiplier</span>
              <p className="text-sm font-mono font-semibold text-cyan-400 mt-0.5">3.00x</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[11px] text-slate-400">Cycle Status</span>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                {lockedPrincipal > 0 ? 'Active & Earning' : 'Awaiting Investment'}
              </p>
            </div>
          </div>
        </div>

        {/* Rank Qualification Preview */}
        <div className="valexis-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Institutional Rank
              </span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>

            <h4 className="text-xl font-black text-white">{user?.currentRank || 'Standard'}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Advance through tiers R1 to R8 to unlock dedicated Trade Capital allocations.
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Next Target:</span>
                <span className="text-cyan-300 font-semibold">R1 Associate Leader</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Self-Investment:</span>
                <span className="font-mono text-slate-300">${lockedPrincipal.toFixed(0)} / $100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Reward:</span>
                <span className="font-semibold text-emerald-400">$150 Trade Capital</span>
              </div>
            </div>
          </div>

          <Link
            to="/community"
            className="mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>View Rank & Tree</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Referral Link Quick Sharing Card */}
      <div className="valexis-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users2 className="w-4 h-4 text-cyan-400" />
            <span>Institutional 5-Level Referral Link</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Share your unique code to build your network and earn downline ROI yields up to 5 tiers.
          </p>
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="w-full md:w-80 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none"
          />
          <button
            onClick={copyReferral}
            className="px-4 py-2 rounded-xl bg-cyan-600/30 border border-cyan-500/50 hover:bg-cyan-600/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
