import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface AuditLogDto {
  auditLogId: number;
  adminUsername: string;
  action: string;
  targetEntity: string;
  targetId?: number;
  details?: string;
  createdAt: string;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AuditLogDto[]>('/admin/audit-logs');
      setLogs(res.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Admin Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Complete immutable trace of all administrative interventions.</p>
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
                  <th className="px-4 py-3 text-left text-slate-400">Admin</th>
                  <th className="px-4 py-3 text-left text-slate-400">Action</th>
                  <th className="px-4 py-3 text-left text-slate-400">Entity</th>
                  <th className="px-4 py-3 text-left text-slate-400">Target ID</th>
                  <th className="px-4 py-3 text-left text-slate-400">Details</th>
                  <th className="px-4 py-3 text-left text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No audit log entries yet.</td></tr>
                ) : logs.map(l => (
                  <tr key={l.auditLogId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">@{l.adminUsername}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{l.targetEntity}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{l.targetId ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[300px]">
                      <p className="truncate" title={l.details ?? ''}>{l.details ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
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
