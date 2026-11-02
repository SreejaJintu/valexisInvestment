import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ExternalLink, RefreshCw, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import type { InvestmentRequestResponseDto } from '../../types';

type Filter = 'All' | 'Pending' | 'Approved' | 'Rejected';

export const AdminInvestmentRequests: React.FC = () => {
  const [requests, setRequests] = useState<InvestmentRequestResponseDto[]>([]);
  const [filter, setFilter] = useState<Filter>('Pending');
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: number; username: string; amount: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<InvestmentRequestResponseDto[]>('/admin/investment-requests');
      setRequests(res.data);
    } catch {
      showToast('error', 'Failed to load investment requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/investment-requests/${id}/approve`);
      showToast('success', 'Investment approved. Capital locked and user notified.');
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    try {
      await api.post(`/admin/investment-requests/${rejectModal.id}/reject`, { reason: rejectReason.trim() });
      showToast('success', 'Investment request rejected. User notified.');
      setRejectModal(null);
      setRejectReason('');
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const filters: Filter[] = ['All', 'Pending', 'Approved', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${
          toast.type === 'success'
            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950 border-rose-500/40 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Investment Verification Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Review blockchain deposits and approve or reject requests.</p>
        </div>
        <button onClick={fetchRequests} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filter === f
                ? f === 'Pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : f === 'Approved' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
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

      {/* Table */}
      <div className="valexis-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No {filter.toLowerCase()} requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">User</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Network</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">TX Hash</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Proof</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Date</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.requestId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">@{r.username}</p>
                      <p className="text-slate-500 text-[10px]">{r.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">${r.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">{r.network}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[120px]">
                      <p className="font-mono text-cyan-400 truncate text-[10px]" title={r.transactionHash}>{r.transactionHash}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.paymentProofUrl ? (
                        <a href={r.paymentProofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : r.status === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {r.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : r.status === 'Rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {r.status}
                      </span>
                      {r.rejectionReason && <p className="text-[10px] text-rose-400 mt-0.5">Reason: {r.rejectionReason}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.status === 'Pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(r.requestId)}
                            disabled={actionLoading === r.requestId}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 transition-colors text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
                          >
                            {actionLoading === r.requestId ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: r.requestId, username: r.username, amount: r.amount })}
                            disabled={actionLoading === r.requestId}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/40 transition-colors text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="valexis-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-white mb-1">Reject Investment Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting ${rejectModal.amount.toFixed(2)} USDT request from @{rejectModal.username}. The user will be notified with the reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (e.g. invalid transaction hash, wrong network, amount mismatch)..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors cursor-pointer"
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
