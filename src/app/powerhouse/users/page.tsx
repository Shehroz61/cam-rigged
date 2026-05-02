'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Smartphone, ShoppingBag, Trash2, RefreshCw } from 'lucide-react';

interface DeviceRecord {
  id: string;
  user_id: string;
  fingerprint: string;
  created_at: string;
  order_count?: number;
}

export default function UsersPage() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [devicesRes, ordersRes] = await Promise.all([
      supabase.from('user_devices').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, status'),
    ]);

    const allOrders = ordersRes.data || [];
    const devicesWithCounts = (devicesRes.data || []).map((d) => ({
      ...d,
      order_count: allOrders.filter((o) => o.user_id === d.user_id).length,
    }));

    setDevices(devicesWithCounts);
    setOrders(allOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReset = async (device: DeviceRecord) => {
    if (!confirm(`Reset device for user ${device.user_id.slice(0, 8)}...? This allows them to log in from a new device.`)) return;
    setDeletingId(device.id);
    try {
      await supabase.from('user_devices').delete().eq('id', device.id);
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  // Aggregate stats
  const uniqueUsers = new Set(devices.map((d) => d.user_id)).size;
  const totalOrders = orders.length;
  const approvedOrders = orders.filter((o) => o.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Users & Devices</h1>
          <p className="text-gray-400 mt-1">View registered users, device locks, and order history.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center mb-3">
            <Users size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{uniqueUsers}</p>
          <p className="text-sm text-gray-400">Registered Users</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-3">
            <ShoppingBag size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalOrders}</p>
          <p className="text-sm text-gray-400">Total Orders</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center mb-3">
            <Smartphone size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{devices.length}</p>
          <p className="text-sm text-gray-400">Locked Devices</p>
        </div>
      </div>

      {/* Devices Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Users size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No registered devices yet</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Device Registry ({devices.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-6 py-3 text-left">User ID</th>
                  <th className="px-6 py-3 text-left">Device Fingerprint</th>
                  <th className="px-6 py-3 text-left">Orders</th>
                  <th className="px-6 py-3 text-left">Registered</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-400">{device.user_id.slice(0, 16)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {device.fingerprint.slice(0, 20)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-bold">{device.order_count}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(device.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={deletingId === device.id}
                        onClick={() => handleReset(device)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-900/30 hover:bg-orange-900/60 text-orange-400 border border-orange-900/50 rounded-lg text-xs font-medium transition disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                        {deletingId === device.id ? 'Resetting...' : 'Reset Device'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
