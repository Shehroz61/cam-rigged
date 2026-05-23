'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, CreditCard, Store, Globe, Plus, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  details: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const s: Record<string, string> = {};
        data.forEach((row) => {
          s[row.key] = row.value;
          if (row.key === 'payment_methods') {
            try {
              setPaymentMethods(JSON.parse(row.value));
            } catch (e) {
              console.error("Failed to parse payment methods", e);
            }
          }
        });
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
      const updatedSettings = { ...settings, payment_methods: JSON.stringify(paymentMethods) };
      for (const key of Object.keys(updatedSettings)) {
        await supabase
          .from('site_settings')
          .upsert({ key, value: updatedSettings[key] });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { id: crypto.randomUUID(), name: '', details: '' }]);
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
  };

  const updatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(paymentMethods.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const shippingFields = [
    {
      key: 'shipping_cost',
      label: 'Shipping Cost (PKR)',
      icon: Store,
      placeholder: '100',
      hint: 'Default shipping charge',
      color: 'text-purple-400',
    },
    {
      key: 'free_shipping_threshold',
      label: 'Free Shipping Threshold (PKR)',
      icon: Store,
      placeholder: '2000',
      hint: 'Order amount for free shipping',
      color: 'text-green-400',
    },
    {
      key: 'min_order_amount',
      label: 'Minimum Order Amount (PKR)',
      icon: Store,
      placeholder: '200',
      hint: 'Minimum cart total required to checkout',
      color: 'text-yellow-400',
    },
  ];

  const siteFields = [
    {
      key: 'site_name',
      label: 'Site Name',
      icon: Globe,
      placeholder: 'CamRigged',
      hint: 'Your store name',
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure payment, shipping, and site settings.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-gray-400" />
                <h2 className="font-bold text-white">Payment Methods</h2>
              </div>
              <button
                type="button"
                onClick={addPaymentMethod}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-semibold transition"
              >
                <Plus size={16} />
                Add Method
              </button>
            </div>
            <div className="p-6 space-y-4">
              {paymentMethods.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No payment methods configured. Add one to allow checkouts.</p>
              ) : (
                paymentMethods.map((method, index) => (
                  <div key={method.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex gap-4 relative">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Method Name</label>
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => updatePaymentMethod(method.id, 'name', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
                          placeholder="e.g. Meezan Bank, JazzCash, USDT"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Details / Account Info</label>
                        <input
                          type="text"
                          value={method.details}
                          onChange={(e) => updatePaymentMethod(method.id, 'details', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
                          placeholder="e.g. Account No / Title / Wallet Address"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(method.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg self-start transition"
                      title="Remove Payment Method"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
              <Store size={16} className="text-gray-400" />
              <h2 className="font-bold text-white">Shipping Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              {shippingFields.map((field) => {
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

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
              <Globe size={16} className="text-gray-400" />
              <h2 className="font-bold text-white">Site Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              {siteFields.map((field) => {
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
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save All Settings'}
          </button>
        </form>
      )}
    </div>
  );
}