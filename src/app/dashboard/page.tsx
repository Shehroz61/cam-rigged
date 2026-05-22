'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  Home,
  RefreshCw,
} from 'lucide-react';

type TabKey = 'orders' | 'profile';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string;
  city: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    setUser(session.user);
    fetchOrders();
  };

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    }
    
    setOrdersLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'shipped' || o.status === 'delivered');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-extrabold shadow-xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              My Dashboard
            </h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={fetchOrders}
            className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 transition"
          >
            <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border rounded-xl p-4 bg-blue-500/10 border-blue-500/20">
            <p className="text-2xl font-extrabold text-blue-400">{orders.length}</p>
            <p className="text-sm text-gray-400 mt-0.5">Total Orders</p>
          </div>
          <div className="border rounded-xl p-4 bg-green-500/10 border-green-500/20">
            <p className="text-2xl font-extrabold text-green-400">{approvedOrders.length}</p>
            <p className="text-sm text-gray-400 mt-0.5">Completed</p>
          </div>
          <div className="border rounded-xl p-4 bg-yellow-500/10 border-yellow-500/20">
            <p className="text-2xl font-extrabold text-yellow-400">{pendingOrders.length}</p>
            <p className="text-sm text-gray-400 mt-0.5">Pending</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === 'orders'
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag size={14} />
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === 'profile'
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={14} />
            Profile
          </button>
        </div>

        {activeTab === 'orders' ? (
          ordersLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
              <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No orders yet</p>
              <p className="text-gray-600 text-sm mt-1">Browse the store and place your first order!</p>
              <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
                Browse Store
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      {order.status === 'delivered' ? (
                        <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                      ) : order.status === 'approved' ? (
                        <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                      ) : order.status === 'shipped' ? (
                        <XCircle size={18} className="text-blue-400 flex-shrink-0" />
                      ) : order.status === 'cancelled' ? (
                        <XCircle size={18} className="text-red-400 flex-shrink-0" />
                      ) : (
                        <Clock size={18} className="text-yellow-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-white">{order.customer_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()} · Rs. {order.total_amount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'approved' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                        order.status === 'delivered' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' :
                        order.status === 'cancelled' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                        'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                      {expandedOrder === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-800 px-5 py-4 bg-gray-900/50">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="font-medium text-white">{order.customer_phone}</p>
                        </div>
                        <div className="bg-gray-800/60 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="font-bold text-white">Rs. {order.total_amount}</p>
                        </div>
                        <div className="bg-gray-800/60 rounded-lg p-3 col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                          <p className="text-sm text-white">{order.delivery_address}, {order.city}</p>
                        </div>
                      </div>
                      <Link
                        href={`/track?id=${order.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
                      >
                        Track Order
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center">
                <User size={16} className="text-purple-400" />
              </div>
              <h2 className="font-bold text-white">Account Info</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Created</p>
                <p className="text-white">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}