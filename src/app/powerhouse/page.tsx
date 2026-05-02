'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, ShoppingCart, Package, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PowerhousePage() {
  const [stats, setStats] = useState({
    totalRevenuePkr: 0,
    totalRevenueUsdt: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('orders').select('*, products(name, price_pkr, price_usdt)'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('user_devices').select('user_id', { count: 'exact', head: true }),
      ]);

      const allOrders = ordersRes.data || [];
      const approved = allOrders.filter((o) => o.status === 'approved');
      const pending = allOrders.filter((o) => o.status === 'pending');
      const rejected = allOrders.filter((o) => o.status === 'rejected');

      const totalRevenuePkr = approved.reduce((s, o) => s + Number(o.products?.price_pkr || 0), 0);
      const totalRevenueUsdt = approved.reduce((s, o) => s + Number(o.products?.price_usdt || 0), 0);

      setStats({
        totalRevenuePkr,
        totalRevenueUsdt,
        pendingOrders: pending.length,
        approvedOrders: approved.length,
        rejectedOrders: rejected.length,
        totalProducts: productsRes.count || 0,
        totalUsers: usersRes.count || 0,
      });

      // Recent 5 orders
      const recent = allOrders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(recent);
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Revenue (PKR)',
      value: `Rs. ${stats.totalRevenuePkr.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Revenue (USDT)',
      value: `$${stats.totalRevenueUsdt.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-teal-500 to-cyan-600',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      href: '/powerhouse/orders',
    },
    {
      label: 'Approved Orders',
      value: stats.approvedOrders,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Rejected Orders',
      value: stats.rejectedOrders,
      icon: XCircle,
      color: 'from-red-500 to-rose-600',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-500/10 border-blue-500/20',
      href: '/powerhouse/inventory',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Overview</h1>
        <p className="text-gray-400 mt-1">Welcome back, Admin. Here's what's happening.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const content = (
                <div className={`border rounded-xl p-5 ${card.bg} hover:scale-[1.02] transition-transform duration-200 cursor-default`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                      <Icon size={16} className="text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-white mb-1">{card.value}</p>
                  <p className="text-sm text-gray-400">{card.label}</p>
                </div>
              );
              return card.href ? (
                <Link key={card.label} href={card.href}>
                  {content}
                </Link>
              ) : (
                <div key={card.label}>{content}</div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/powerhouse/orders"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all group"
            >
              <ShoppingCart size={20} className="text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Review Orders</h3>
              <p className="text-sm text-gray-400 mt-1">{stats.pendingOrders} orders need attention</p>
            </Link>
            <Link
              href="/powerhouse/inventory"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
            >
              <Package size={20} className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Manage Inventory</h3>
              <p className="text-sm text-gray-400 mt-1">Upload, view & delete products</p>
            </Link>
            <Link
              href="/powerhouse/users"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
            >
              <Users size={20} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">User Management</h3>
              <p className="text-sm text-gray-400 mt-1">Manage devices & registrations</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Recent Orders</h2>
              <Link href="/powerhouse/orders" className="text-sm text-blue-400 hover:text-blue-300 transition">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                    <th className="px-6 py-3 text-left">Product</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">TID</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders yet.</td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-white">{order.products?.name || '—'}</td>
                        <td className="px-6 py-3 text-gray-300">Rs. {order.amount}</td>
                        <td className="px-6 py-3 text-gray-400 font-mono text-xs">{order.transaction_id}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'approved' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                            order.status === 'rejected' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                            'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
