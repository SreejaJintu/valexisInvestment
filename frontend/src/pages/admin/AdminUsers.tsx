import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { AdminUserDto } from '../../types';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AdminUserDto[]>('/admin/users');
      setUsers(res.data);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            User Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">All investor accounts with balances and status.</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
        />
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
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Rank</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Locked Principal</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Active Growth</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-semibold">Withdrawable</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.userId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">@{u.username}</p>
                      <p className="text-slate-500 text-[10px]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.role === 'Admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                        {u.currentRank || 'Unranked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-400">${u.lockedPrincipal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">${u.activeGrowth.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">${u.withdrawableBalance.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
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
