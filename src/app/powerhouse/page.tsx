'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Zap, Package, ShoppingCart, Users, TrendingUp, Edit2, Trash2, Plus, Tag } from 'lucide-react';

export default function PowerhousePage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
    totalBundles: 0,
    totalCategories: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [ordersRes, productsRes, bundlesRes, categoriesRes] = await Promise.all([
        supabase.from('orders').select('id, status, total_amount, customer_name, created_at'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('bundles').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      const allOrders = ordersRes.data || [];
      const approved = allOrders.filter((o) => o.status === 'approved');
      const pending = allOrders.filter((o) => o.status === 'pending');
      const delivered = allOrders.filter((o) => o.status === 'delivered');

      const totalRevenue = approved.reduce((s, o) => s + Number(o.total_amount || 0), 0);

      setStats({
        totalRevenue,
        pendingOrders: pending.length,
        approvedOrders: approved.length,
        deliveredOrders: delivered.length,
        totalProducts: productsRes.count || 0,
        totalBundles: bundlesRes.count || 0,
        totalCategories: categoriesRes.count || 0,
      });

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
      label: 'Revenue',
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: 'from-yellow-500 to-orange-500',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      href: '/powerhouse/orders',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-500/10 border-blue-500/20',
      href: '/powerhouse/inventory',
    },
    {
      label: 'Bundles',
      value: stats.totalBundles,
      icon: Tag,
      color: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-500/10 border-purple-500/20',
      href: '/powerhouse/bundles',
    },
    {
      label: 'Categories',
      value: stats.totalCategories,
      icon: Tag,
      color: 'from-cyan-500 to-blue-600',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      href: '/powerhouse/categories',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage your store, products, and orders.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/powerhouse/orders"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all group"
            >
              <ShoppingCart size={20} className="text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Manage Orders</h3>
              <p className="text-sm text-gray-400 mt-1">{stats.pendingOrders} orders need attention</p>
            </Link>
            <Link
              href="/powerhouse/inventory"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
            >
              <Package size={20} className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Manage Products</h3>
              <p className="text-sm text-gray-400 mt-1">Add, edit & delete products</p>
            </Link>
            <Link
              href="/powerhouse/bundles"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
            >
              <Tag size={20} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Manage Bundles</h3>
              <p className="text-sm text-gray-400 mt-1">Create discount bundles</p>
            </Link>
          </div>

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
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No orders yet.</td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-white">{order.customer_name || '—'}</td>
                        <td className="px-6 py-3 text-gray-300">Rs. {order.total_amount}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'approved' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                            order.status === 'delivered' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                            'bg-red-900/50 text-red-400 border border-red-800'
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