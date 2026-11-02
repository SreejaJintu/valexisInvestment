import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import type { InvestmentSettingDto } from '../../types';

export const AdminRoiSettings: React.FC = () => {
  const [settings, setSettings] = useState<InvestmentSettingDto | null>(null);
  const [form, setForm] = useState({ dailyRoiRate: '', capMultiplier: '', spotRewardRate: '', minAmount: '', maxAmount: '', feeRate: '', minWithdrawal: '', walletAddress: '', executionHour: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get<InvestmentSettingDto>('/admin/roi-settings');
        setSettings(res.data);
        setForm({
          dailyRoiRate: (res.data.DailyRoiRate * 100).toFixed(4),
          capMultiplier: res.data.CapMultiplier.toString(),
          spotRewardRate: (res.data.SpotRewardRate * 100).toFixed(2),
          minAmount: res.data.MinInvestmentAmount.toString(),
          maxAmount: res.data.MaxInvestmentAmount.toString(),
          feeRate: ((res.data.WithdrawalFeeRate ?? 0.05) * 100).toFixed(2),
          minWithdrawal: (res.data.MinWithdrawalAmount ?? 20).toString(),
          walletAddress: res.data.DepositWalletAddress,
          executionHour: (res.data.RoiExecutionHourUtc ?? 0).toString(),
        });
      } catch {
        setError('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await api.put('/admin/roi-settings', {
        dailyRoiRate: parseFloat(form.dailyRoiRate) / 100,
        capMultiplier: parseFloat(form.capMultiplier),
        spotRewardRate: parseFloat(form.spotRewardRate) / 100,
        minInvestmentAmount: parseFloat(form.minAmount),
        maxInvestmentAmount: parseFloat(form.maxAmount),
        withdrawalFeeRate: parseFloat(form.feeRate) / 100,
        minWithdrawalAmount: parseFloat(form.minWithdrawal),
        depositWalletAddress: form.walletAddress.trim(),
        roiExecutionHourUtc: parseInt(form.executionHour),
      });
      setSuccess('Settings updated successfully. New ROI rate applies to existing investments per configured policy.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, suffix = '', hint = '') => (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 pr-14"
        />
        {suffix && <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          ROI & Platform Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure daily ROI rate, investment cap, spot reward, withdrawal fee, and deposit address.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4" /><span>{success}</span>
            </div>
          )}

          <div className="valexis-card rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">ROI Settings</p>
            <div className="grid grid-cols-2 gap-4">
              {field('Daily ROI Rate', 'dailyRoiRate', '%', 'e.g. 0.8 for 0.8% per day')}
              {field('Cap Multiplier', 'capMultiplier', 'x', 'e.g. 3 for 3x total earnings cap per investment')}
            </div>
          </div>

          <div className="valexis-card rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Investment Limits</p>
            <div className="grid grid-cols-2 gap-4">
              {field('Min Investment', 'minAmount', 'USDT')}
              {field('Max Investment', 'maxAmount', 'USDT')}
            </div>
          </div>

          <div className="valexis-card rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Spot Reward & Withdrawal</p>
            <div className="grid grid-cols-2 gap-4">
              {field('Spot Reward Rate', 'spotRewardRate', '%', 'One-time reward to referrer on deposit approval')}
              {field('Withdrawal Fee', 'feeRate', '%', 'Deducted from withdrawal amount')}
              {field('Min Withdrawal', 'minWithdrawal', 'USDT')}
              {field('ROI Execution Hour (UTC)', 'executionHour', 'h', '0 = midnight UTC')}
            </div>
          </div>

          <div className="valexis-card rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Deposit Wallet</p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Deposit Address (TRC20)</label>
              <input
                type="text"
                value={form.walletAddress}
                onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full valexis-gradient-btn py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Settings</span></>}
          </button>
        </form>
      )}
    </div>
  );
};
