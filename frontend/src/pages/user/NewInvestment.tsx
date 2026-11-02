import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  ShieldCheck,
  TrendingUp,
  Target
} from 'lucide-react';
import api from '../../services/api';
import type { InvestmentSettingDto, InvestmentRequestResponseDto } from '../../types';

export const NewInvestment: React.FC = () => {
  const [settings, setSettings] = useState<InvestmentSettingDto | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [network, setNetwork] = useState<string>('TRC20');
  const [txHash, setTxHash] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [myRequests, setMyRequests] = useState<InvestmentRequestResponseDto[]>([]);

  const fetchSettingsAndHistory = async () => {
    try {
      const [settingsRes, requestsRes] = await Promise.all([
        api.get<InvestmentSettingDto>('/investments/settings'),
        api.get<InvestmentRequestResponseDto[]>('/investments/my-requests'),
      ]);
      setSettings(settingsRes.data);
      setMyRequests(requestsRes.data);
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    fetchSettingsAndHistory();
  }, []);

  const depositAddress = settings?.DepositWalletAddress || 'TValexisOfficialDepositAddressTRC20xxxx';
  const dailyRoiRate = settings?.DailyRoiRate || 0.0080;
  const capMultiplier = settings?.CapMultiplier || 3.00;

  const dailyReturnUsdt = amount * dailyRoiRate;
  const maxCapTargetUsdt = amount * capMultiplier;

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!txHash || txHash.trim().length < 10) {
      setError('Please provide a valid blockchain transaction hash (TXID).');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/investments/request', {
        category: 'Crypto',
        amount: Number(amount),
        token: 'USDT',
        network: network,
        transactionHash: txHash.trim(),
        paymentProofUrl: proofUrl.trim() || null,
      });

      setSuccess('Your deposit request has been submitted successfully with Pending status. Our verification desk will confirm the blockchain deposit shortly.');
      setTxHash('');
      setProofUrl('');
      await fetchSettingsAndHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit investment request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-cyan-400" />
          <span>New Crypto Investment</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Activate institutional capital in USDT to begin earning 0.8% daily ROI up to your 3x cap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deposit Form & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Official Destination Address */}
          <div className="valexis-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Step 1: Transfer Funds
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-semibold">
                Official Treasury
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Send your exact desired USDT amount to the platform's multi-signature vault address below.
            </p>

            {/* Network Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Blockchain Network
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNetwork('TRC20')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    network === 'TRC20'
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">USDT (TRC20)</p>
                  <p className="text-[11px] text-slate-400">Tron Network • Low gas fee</p>
                </button>

                <button
                  type="button"
                  onClick={() => setNetwork('BEP20')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    network === 'BEP20'
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">USDT (BEP20)</p>
                  <p className="text-[11px] text-slate-400">BNB Smart Chain</p>
                </button>
              </div>
            </div>

            {/* Deposit Address Box */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                  Destination Deposit Address ({network})
                </span>
                <span className="font-mono text-xs md:text-sm text-cyan-300 select-all truncate block">
                  {depositAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={copyAddress}
                className="px-3.5 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Verification Form */}
          <div className="valexis-card rounded-2xl p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-2">
              Step 2: Submit Deposit Proof
            </span>
            <p className="text-xs text-slate-400 mb-6">
              Enter your transfer details so the admin audit desk can verify the blockchain transaction.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Investment Amount (USDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    min="50"
                    max="100000"
                    step="10"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    USDT
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Min: 50 USDT</span>
                  <span>Max: 100,000 USDT</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Blockchain Transaction Hash (TXID)
                </label>
                <input
                  type="text"
                  required
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="e.g. 7f3a8b4c29e1d0f5..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtain this hash from your sending wallet (Binance, TrustWallet, etc.) upon transfer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Proof Link / Screenshot URL <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://imgur.com/... or blockchain explorer link"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full valexis-gradient-btn py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-6 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Investment Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Dynamic Yield Forecast & Recent Requests */}
        <div className="space-y-6">
          {/* Real-time Yield Calculator */}
          <div className="valexis-card rounded-2xl p-6 border-t-4 border-t-cyan-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-1">
              Yield Forecast
            </span>
            <h3 className="text-base font-bold text-white mb-4">Investment Metrics</h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Principal Deposit:</span>
                <span className="text-sm font-mono font-bold text-white">${amount.toFixed(2)} USDT</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex justify-between items-center">
                <span className="text-xs text-emerald-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Daily ROI (0.8%):
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  +${dailyReturnUsdt.toFixed(2)} / day
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex justify-between items-center">
                <span className="text-xs text-cyan-300 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> 3x Cap Target:
                </span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  ${maxCapTargetUsdt.toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/30 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Each investment cycle runs independently. Once your total earnings reach the 3x cap target, the investment cycle automatically matures.
              </span>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="valexis-card rounded-2xl p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
              My Request History
            </span>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {myRequests.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No requests submitted yet</p>
              ) : (
                myRequests.slice(0, 5).map((r) => (
                  <div key={r.requestId} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold font-mono text-white">${r.amount.toFixed(2)} USDT</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 truncate">TX: {r.transactionHash}</p>
                    {r.rejectionReason && (
                      <p className="text-[10px] text-rose-400 mt-1">Reason: {r.rejectionReason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
