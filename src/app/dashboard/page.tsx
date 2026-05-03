'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Smartphone,
  User,
  LogOut,
  Home,
  RefreshCw,
} from 'lucide-react';

type TabKey = 'orders' | 'pending' | 'device' | 'profile';

interface Order {
  id: string;
  product_id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  products: { name: string; price_pkr: number; encrypted_content_url: string | null } | null;
}

interface DeviceInfo {
  fingerprint: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Profile
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);

    const [ordersRes, deviceRes, profileRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, products(name, price_pkr, encrypted_content_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('user_devices').select('fingerprint, created_at').eq('user_id', user.id).single(),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    setOrders((ordersRes.data as Order[]) || []);
    setDevice(deviceRes.data || null);
    setFullName(profileRes.data?.full_name || '');
    setOrdersLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    await supabase.from('profiles').upsert({ id: user.id, full_name: fullName });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg('Password updated successfully!');
      setNewPassword('');
    }
    setTimeout(() => setPasswordMsg(''), 4000);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allOrders = orders;
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status === 'approved');
  const rejectedOrders = orders.filter((o) => o.status === 'rejected');

  const initials = (fullName || user.email || 'U').charAt(0).toUpperCase();

  const tabs: { key: TabKey; label: string; icon: any; badge?: number }[] = [
    { key: 'orders', label: 'My Orders', icon: ShoppingBag, badge: allOrders.length },
    { key: 'pending', label: 'Pending', icon: Clock, badge: pendingOrders.length },
    { key: 'device', label: 'My Device', icon: Smartphone },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            CamRigged
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
              <Home size={14} />
              Store
            </Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-extrabold shadow-xl">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {fullName || 'My Dashboard'}
            </h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <button
            onClick={fetchData}
            className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 transition"
          >
            <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: allOrders.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Approved', value: approvedOrders.length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Pending Review', value: pendingOrders.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          ].map((s) => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                  activeTab === tab.key
                    ? 'bg-gray-800 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {ordersLoading && (activeTab === 'orders' || activeTab === 'pending') ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'orders' ? (
          <OrdersTab
            orders={allOrders}
            expandedOrder={expandedOrder}
            setExpandedOrder={setExpandedOrder}
          />
        ) : activeTab === 'pending' ? (
          <PendingTab orders={pendingOrders} />
        ) : activeTab === 'device' ? (
          <DeviceTab device={device} />
        ) : (
          <ProfileTab
            email={user.email || ''}
            fullName={fullName}
            setFullName={setFullName}
            onSaveProfile={handleSaveProfile}
            savingProfile={savingProfile}
            profileSaved={profileSaved}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            onChangePassword={handleChangePassword}
            savingPassword={savingPassword}
            passwordMsg={passwordMsg}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────

function OrdersTab({ orders, expandedOrder, setExpandedOrder }: {
  orders: Order[];
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
        <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">No orders yet</p>
        <p className="text-gray-600 text-sm mt-1">Browse the store and place your first order!</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
          Browse Store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id;
        return (
          <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <StatusIcon status={order.status} />
                <div>
                  <p className="font-semibold text-white">{order.products?.name || 'Unknown Product'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString()} · Rs. {order.amount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-800 px-5 py-4 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <InfoCard label="Transaction ID" value={order.transaction_id} mono />
                  <InfoCard label="Amount" value={`Rs. ${order.amount}`} />
                  <InfoCard label="Submitted" value={new Date(order.created_at).toLocaleString()} />
                  <InfoCard label="Order ID" value={order.id.slice(0, 12) + '...'} mono />
                </div>

                {order.notes && (
                  <div className={`rounded-lg p-3 mb-4 ${order.status === 'rejected' ? 'bg-red-900/20 border border-red-800/50' : 'bg-blue-900/20 border border-blue-800/50'}`}>
                    <p className={`text-xs font-medium mb-1 ${order.status === 'rejected' ? 'text-red-400' : 'text-blue-400'}`}>
                      Admin Note
                    </p>
                    <p className="text-sm text-gray-300">{order.notes}</p>
                  </div>
                )}

                {order.screenshot_url && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 uppercase font-medium">Payment Receipt</p>
                    <a href={order.screenshot_url} target="_blank" rel="noreferrer">
                      <img
                        src={order.screenshot_url}
                        alt="Receipt"
                        className="max-h-40 rounded-lg border border-gray-700 object-contain"
                      />
                    </a>
                  </div>
                )}

                {order.status === 'approved' && order.products?.encrypted_content_url && (
                  <Link
                    href={`/view/${order.product_id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Play size={14} />
                    Access Content
                  </Link>
                )}

                {order.status === 'rejected' && (
                  <Link
                    href="/checkout"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm rounded-xl transition"
                  >
                    🔄 Resubmit Order
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PendingTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
        <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">No pending orders!</p>
        <p className="text-gray-600 text-sm mt-1">All your orders have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 flex items-start gap-3">
        <Clock size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-300">
          You have {orders.length} order{orders.length !== 1 ? 's' : ''} pending review. Our team typically responds within 24 hours. You'll receive an email when your order is processed.
        </p>
      </div>
      {orders.map((order) => (
        <div key={order.id} className="bg-gray-900 border border-yellow-800/30 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white">{order.products?.name || 'Unknown Product'}</h3>
              <p className="text-sm text-gray-400 mt-1">Rs. {order.amount} · TID: <span className="font-mono">{order.transaction_id}</span></p>
              <p className="text-xs text-gray-600 mt-1">Submitted: {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeviceTab({ device }: { device: DeviceInfo | null }) {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
            <Smartphone size={16} className="text-blue-400" />
          </div>
          <h2 className="font-bold text-white">Registered Device</h2>
        </div>

        {device ? (
          <>
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Device Fingerprint</p>
                <p className="font-mono text-sm text-white break-all">{device.fingerprint}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Registered On</p>
                <p className="text-sm text-white">{new Date(device.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                🔒 Your account is locked to this device for security. If you need to access from a different device, contact admin at <a href="mailto:support@camrigged.com" className="underline">support@camrigged.com</a>.
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">No device registered yet. Log in and a device will be registered automatically.</p>
        )}
      </div>
    </div>
  );
}

function ProfileTab({
  email, fullName, setFullName, onSaveProfile, savingProfile, profileSaved,
  newPassword, setNewPassword, onChangePassword, savingPassword, passwordMsg,
}: any) {
  return (
    <div className="space-y-4 max-w-lg">
      {/* Profile Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center">
            <User size={16} className="text-purple-400" />
          </div>
          <h2 className="font-bold text-white">Profile Info</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="Your full name"
            />
          </div>
          <button
            onClick={onSaveProfile}
            disabled={savingProfile}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              profileSaved ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
            } disabled:opacity-50`}
          >
            {savingProfile ? 'Saving...' : profileSaved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-white mb-4">Change Password</h2>
        <div className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
            placeholder="New password (min 6 chars)"
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
              {passwordMsg}
            </p>
          )}
          <button
            onClick={onChangePassword}
            disabled={savingPassword || !newPassword}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-bold text-sm text-white transition"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
    approved: 'bg-green-900/50 text-green-400 border border-green-800',
    rejected: 'bg-red-900/50 text-red-400 border border-red-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${map[status] || ''}`}>
      {status.toUpperCase()}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <CheckCircle size={18} className="text-green-400 flex-shrink-0" />;
  if (status === 'rejected') return <XCircle size={18} className="text-red-400 flex-shrink-0" />;
  return <Clock size={18} className="text-yellow-400 flex-shrink-0" />;
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
    </div>
  );
}
