'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, CreditCard, Building2, Coins } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const s: Record<string, string> = {};
        data.forEach((row) => (s[row.key] = row.value));
        setSettings(s);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const key of ['jazzcash_account', 'bank_transfer', 'usdt_trc20']) {
        await supabase
          .from('site_settings')
          .update({ value: settings[key] })
          .eq('key', key);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const paymentFields = [
    {
      key: 'jazzcash_account',
      label: 'JazzCash Account',
      icon: CreditCard,
      placeholder: '03001234567 - Account Name',
      hint: 'Mobile number and account holder name',
      color: 'text-red-400',
    },
    {
      key: 'bank_transfer',
      label: 'Bank Transfer',
      icon: Building2,
      placeholder: 'Bank Name - Account Number - Account Name',
      hint: 'Full bank details for transfer',
      color: 'text-blue-400',
    },
    {
      key: 'usdt_trc20',
      label: 'USDT Wallet (TRC20)',
      icon: Coins,
      placeholder: 'TRC20 wallet address',
      hint: 'USDT TRC20 wallet address for crypto payments',
      color: 'text-green-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure payment methods and global site settings.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
              <Settings size={16} className="text-gray-400" />
              <h2 className="font-bold text-white">Payment Methods</h2>
            </div>
            <div className="p-6 space-y-5">
              {paymentFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <Icon size={14} className={field.color} />
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                      placeholder={field.placeholder}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">{field.hint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
              saved
                ? 'bg-green-600 shadow-lg shadow-green-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50'
            }`}
          >
            <Save size={16} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
