import React, { useState, useEffect } from 'react';
import { Wallet, Send, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Info } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { WithdrawalRequestDto, InvestmentSettingDto } from '../../types';

export const Payout: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDto[]>([]);
  const [settings, setSettings] = useState<InvestmentSettingDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');

  const withdrawableBalance = user?.withdrawableBalance ?? 0;
  const minWithdrawal = settings?.MinWithdrawalAmount ?? 20;
  const feeRate = settings?.WithdrawalFeeRate ?? 0.05;
  const feeAmount = amount * feeRate;
  const netAmount = Math.max(0, amount - feeAmount);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        api.get<WithdrawalRequestDto[]>('/payout/my-withdrawals'),
        api.get<InvestmentSettingDto>('/investments/settings'),
      ]);
      setWithdrawals(wRes.data);
      setSettings(sRes.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const hasPending = withdrawals.some(w => w.status === 'Pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (amount < minWithdrawal) {
      setError(`Minimum withdrawal is ${minWithdrawal} USDT.`);
      return;
    }
    if (amount > withdrawableBalance) {
      setError('Requested amount exceeds your withdrawable balance.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter a valid destination wallet address.');
      return;
    }
    if (hasPending) {
      setError('You already have a pending withdrawal request. Wait for it to be processed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/payout/request', {
        requestedAmount: amount,
        destinationAddress: address.trim(),
        network,
      });
      setSuccess(`Withdrawal request of ${amount.toFixed(2)} USDT submitted. Net payout: ${netAmount.toFixed(2)} USDT (${(feeRate * 100).toFixed(0)}% fee deducted).`);
      setAmount(50);
      setAddress('');
      await fetchData();
      await refreshProfile?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'Paid') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'Rejected') return <XCircle className="w-4 h-4 text-rose-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-400" />
          <span>Payout Requests</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Withdraw from your available balance to your USDT wallet.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Request Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Balance Card */}
          <div className="valexis-card rounded-2xl p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs text-slate-400 mb-1">Available Withdrawable Balance</p>
            <p className="text-3xl font-bold font-mono text-emerald-400">${withdrawableBalance.toFixed(2)} <span className="text-sm text-slate-400 font-normal">USDT</span></p>
            {hasPending && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>One pending request in queue</span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="valexis-card rounded-2xl p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-4">Submit Withdrawal</span>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Network selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Withdrawal Network</label>
                <div className="grid grid-cols-2 gap-3">
                  {['TRC20', 'BEP20'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNetwork(n)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        network === n
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-200">USDT ({n})</p>
                      <p className="text-[11px] text-slate-400">{n === 'TRC20' ? 'Tron Network' : 'BNB Smart Chain'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Destination Wallet Address ({network})
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={network === 'TRC20' ? 'T...' : '0x...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Amount (USDT) — Min: {minWithdrawal} USDT
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    min={minWithdrawal}
                    max={withdrawableBalance}
                    step="1"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">USDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || hasPending || withdrawableBalance <= 0}
                className="w-full valexis-gradient-btn py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Payout Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Fee preview */}
        <div className="space-y-5">
          <div className="valexis-card rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Payout Preview</p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Requested</span>
                <span className="font-mono text-white">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Fee ({(feeRate * 100).toFixed(0)}%)</span>
                <span className="font-mono text-rose-400">-${feeAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between text-sm">
                <span className="font-semibold text-slate-300">Net Payout</span>
                <span className="font-mono font-bold text-emerald-400">${netAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5" />
              <span>Processing takes 1–3 business days. Admin will record the blockchain TX hash on completion.</span>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="valexis-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Withdrawal History</span>
          <button onClick={fetchData} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Requested</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Net</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Address</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.withdrawalId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">${w.requestedAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">${w.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 truncate max-w-[120px]">{w.destinationAddress}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        w.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : w.status === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {statusIcon(w.status)}
                        {w.status}
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
