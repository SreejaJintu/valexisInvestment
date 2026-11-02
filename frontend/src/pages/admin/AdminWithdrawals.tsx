import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, XCircle, Clock, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import type { WithdrawalRequestDto } from '../../types';

export const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Paid' | 'Rejected'>('Pending');
  const [payModal, setPayModal] = useState<{ id: number; amount: number } | null>(null);
  const [txHash, setTxHash] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<WithdrawalRequestDto[]>('/admin/withdrawals');
      setWithdrawals(res.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const filtered = filter === 'All' ? withdrawals : withdrawals.filter(w => w.status === filter);
  const counts = {
    All: withdrawals.length,
    Pending: withdrawals.filter(w => w.status === 'Pending').length,
    Paid: withdrawals.filter(w => w.status === 'Paid').length,
    Rejected: withdrawals.filter(w => w.status === 'Rejected').length,
  };

  const handlePay = async () => {
    if (!payModal || !txHash.trim()) return;
    setActionLoading(payModal.id);
    try {
      await api.post(`/admin/withdrawals/${payModal.id}/pay`, { transactionHash: txHash.trim() });
      showToast('success', 'Withdrawal marked as Paid. User notified.');
      setPayModal(null);
      setTxHash('');
      await fetchWithdrawals();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to process payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    try {
      await api.post(`/admin/withdrawals/${rejectModal.id}/reject`, { reason: rejectReason.trim() });
      showToast('success', 'Withdrawal rejected. Balance refunded to user.');
      setRejectModal(null);
      setRejectReason('');
      await fetchWithdrawals();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' : 'bg-rose-950 border-rose-500/40 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            Withdrawal Requests
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Review and process user payout requests.</p>
        </div>
        <button onClick={fetchWithdrawals} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        {(['All', 'Pending', 'Paid', 'Rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filter === f
                ? f === 'Pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : f === 'Paid' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : f === 'Rejected' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span>{f}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="valexis-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-slate-400">Date</th>
                  <th className="px-4 py-3 text-right text-slate-400">Requested</th>
                  <th className="px-4 py-3 text-right text-slate-400">Fee</th>
                  <th className="px-4 py-3 text-right text-slate-400">Net</th>
                  <th className="px-4 py-3 text-left text-slate-400">Address</th>
                  <th className="px-4 py-3 text-left text-slate-400">Network</th>
                  <th className="px-4 py-3 text-center text-slate-400">Status</th>
                  <th className="px-4 py-3 text-center text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500">No {filter.toLowerCase()} withdrawal requests.</td></tr>
                ) : filtered.map(w => (
                  <tr key={w.withdrawalId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">${w.requestedAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-400">${w.feeAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">${w.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[10px] max-w-[120px] truncate">{w.destinationAddress}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">{w.network}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        w.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : w.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {w.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : w.status === 'Rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {w.status}
                      </span>
                      {w.transactionHash && <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[100px]">{w.transactionHash}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === 'Pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setPayModal({ id: w.withdrawalId, amount: w.netAmount })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: w.withdrawalId })}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/40 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="valexis-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-white mb-1">Confirm Payout — ${payModal.amount.toFixed(2)} USDT</h3>
            <p className="text-xs text-slate-400 mb-4">Enter the blockchain transaction hash after sending payment.</p>
            <input
              type="text"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder="Blockchain TX hash..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-emerald-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setPayModal(null); setTxHash(''); }} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handlePay}
                disabled={!txHash.trim() || actionLoading !== null}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
              >
                {actionLoading ? 'Processing...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="valexis-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-white mb-1">Reject Withdrawal</h3>
            <p className="text-xs text-slate-400 mb-4">The reserved balance will be refunded to the user.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
