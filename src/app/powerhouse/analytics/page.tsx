'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, ShoppingCart, Package } from 'lucide-react';

interface MonthlyData {
  month: string;
  count: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: orders } = await supabase
        .from('orders')
        .select('*, products(name, price_pkr, price_usdt)')
        .order('created_at', { ascending: true });

      const all = orders || [];
      setAllOrders(all);

      // Top products
      const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
      all.filter((o) => o.status === 'approved').forEach((o) => {
        const name = o.products?.name || 'Unknown';
        if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 };
        productMap[name].count++;
        productMap[name].revenue += Number(o.products?.price_pkr || 0);
      });
      const sorted = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5);
      setTopProducts(sorted);

      // Monthly data (last 6 months)
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const monthOrders = all.filter((o) => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status === 'approved';
        });
        months.push({
          month: label,
          count: monthOrders.length,
          revenue: monthOrders.reduce((s, o) => s + Number(o.products?.price_pkr || 0), 0),
        });
      }
      setMonthlyData(months);
      setLoading(false);
    }
    fetchData();
  }, []);

  const approved = allOrders.filter((o) => o.status === 'approved');
  const totalRevenuePkr = approved.reduce((s, o) => s + Number(o.products?.price_pkr || 0), 0);
  const totalRevenueUsdt = approved.reduce((s, o) => s + Number(o.products?.price_usdt || 0), 0);
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Sales performance and revenue overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue (PKR)', value: `Rs. ${totalRevenuePkr.toLocaleString()}`, color: 'text-green-400', icon: TrendingUp },
              { label: 'Total Revenue (USDT)', value: `$${totalRevenueUsdt.toFixed(2)}`, color: 'text-teal-400', icon: TrendingUp },
              { label: 'Approved Orders', value: approved.length, color: 'text-blue-400', icon: ShoppingCart },
              { label: 'Conversion Rate', value: `${allOrders.length ? Math.round((approved.length / allOrders.length) * 100) : 0}%`, color: 'text-purple-400', icon: BarChart3 },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <Icon size={16} className={`${card.color} mb-3`} />
                  <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Monthly Revenue Bar Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-white mb-6">Monthly Revenue (PKR) — Last 6 Months</h2>
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((m) => {
                const height = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-400 font-mono">
                      {m.revenue > 0 ? `${Math.round(m.revenue / 1000)}k` : '0'}
                    </p>
                    <div className="w-full flex items-end" style={{ height: '140px' }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 relative group cursor-pointer"
                        style={{ height: `${Math.max(height, m.revenue > 0 ? 4 : 0)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                          Rs. {m.revenue.toLocaleString()} ({m.count} orders)
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{m.month}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <Package size={16} className="text-amber-400" />
              <h2 className="font-bold text-white">Top Products by Sales</h2>
            </div>
            {topProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No approved orders yet.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {topProducts.map((p, i) => {
                  const maxCount = topProducts[0]?.count || 1;
                  const pct = (p.count / maxCount) * 100;
                  return (
                    <div key={p.name} className="px-6 py-4 flex items-center gap-4">
                      <span className="w-6 text-center text-gray-500 font-bold text-sm">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{p.name}</p>
                        <div className="mt-1.5 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{p.count} sales</p>
                        <p className="text-xs text-gray-400">Rs. {p.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Status Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending', count: allOrders.filter((o) => o.status === 'pending').length, color: 'bg-yellow-500', bg: 'bg-yellow-900/20 border-yellow-800/40' },
              { label: 'Approved', count: approved.length, color: 'bg-green-500', bg: 'bg-green-900/20 border-green-800/40' },
              { label: 'Rejected', count: allOrders.filter((o) => o.status === 'rejected').length, color: 'bg-red-500', bg: 'bg-red-900/20 border-red-800/40' },
            ].map((s) => {
              const pct = allOrders.length > 0 ? Math.round((s.count / allOrders.length) * 100) : 0;
              return (
                <div key={s.label} className={`border rounded-xl p-5 ${s.bg}`}>
                  <p className="text-2xl font-extrabold text-white">{s.count}</p>
                  <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
