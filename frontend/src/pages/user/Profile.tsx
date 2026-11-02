import React, { useState } from 'react';
import { User, Mail, Shield, Share2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/profile/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess('Master security password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Overview Card */}
      <div className="valexis-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Investor Profile</h2>
        <p className="text-xs text-slate-400 mb-6">Account registration and institutional identity</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Username
            </span>
            <p className="text-sm font-semibold text-white">{user?.username}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
            </span>
            <p className="text-sm font-semibold text-white">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" /> My Referral Code
            </span>
            <p className="text-sm font-mono font-bold text-cyan-400">{user?.referralCode}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Sponsor
            </span>
            <p className="text-sm font-semibold text-white">
              {user?.sponsorUsername ? `@${user.sponsorUsername}` : 'Platform Root'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="valexis-card rounded-2xl p-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span>Security & Password</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">Update your account authentication credentials</p>

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

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="valexis-gradient-btn px-6 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
