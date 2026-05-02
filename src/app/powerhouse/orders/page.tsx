'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, SkipForward, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import Image from 'next/image';

type OrderStatus = 'pending' | 'approved' | 'rejected' | 'all';

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  products: { name: string; price_pkr: number; price_usdt: number } | null;
  user_email?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ orderId: string; userEmail: string; productName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, products(name, price_pkr, price_usdt)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setOrders(data as Order[]);
    }
    setSkipped(new Set()); // Reset skipped on refresh
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (order: Order, action: 'approved' | 'rejected', notes?: string) => {
    setProcessing(order.id);
    try {
      await supabase
        .from('orders')
        .update({ status: action, notes: notes || null })
        .eq('id', order.id);

      // Fire email
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action === 'approved' ? 'order_approved' : 'order_rejected',
          toEmail: order.user_email || '',
          productName: order.products?.name || 'your product',
          amount: order.amount,
          transactionId: order.transaction_id,
          orderId: order.id,
          notes: notes || '',
        }),
      });

      await fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    const order = orders.find((o) => o.id === rejectModal.orderId);
    if (!order) return;
    setRejectModal(null);
    await handleAction(order, 'rejected', rejectReason);
    setRejectReason('');
  };

  const handleSkip = (orderId: string) => {
    setSkipped((prev) => new Set([...prev, orderId]));
  };

  const visibleOrders = orders.filter((o) => !skipped.has(o.id));

  const filterTabs: { label: string; value: OrderStatus; color: string }[] = [
    { label: 'Pending', value: 'pending', color: 'border-yellow-500 text-yellow-400' },
    { label: 'Approved', value: 'approved', color: 'border-green-500 text-green-400' },
    { label: 'Rejected', value: 'rejected', color: 'border-red-500 text-red-400' },
    { label: 'All Orders', value: 'all', color: 'border-blue-500 text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Order Vault</h1>
          <p className="text-gray-400 mt-1">Review, approve, or reject customer payment submissions.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              filter === tab.value
                ? `${tab.color} bg-gray-800/80`
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skipped Banner */}
      {skipped.size > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-yellow-400 text-sm">
            {skipped.size} order(s) skipped (hidden from view, still pending in DB)
          </p>
          <button
            onClick={() => setSkipped(new Set())}
            className="text-yellow-400 hover:text-yellow-300 text-xs underline"
          >
            Restore all
          </button>
        </div>
      )}

      {/* Orders */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Filter size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No {filter === 'all' ? '' : filter} orders</p>
          <p className="text-gray-600 text-sm mt-1">
            {filter === 'pending' ? 'All caught up! No pending reviews.' : `No ${filter} orders to display.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Order Info */}
                <div className="lg:col-span-2 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{order.products?.name || 'Unknown Product'}</h3>
                      <p className="text-gray-500 text-xs font-mono mt-0.5">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      order.status === 'approved' ? 'bg-green-900/30 text-green-400 border-green-800' :
                      order.status === 'rejected' ? 'bg-red-900/30 text-red-400 border-red-800' :
                      'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="font-bold text-white">Rs. {order.amount}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                      <p className="font-mono text-sm text-white truncate">{order.transaction_id}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Submitted</p>
                      <p className="text-sm text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">User</p>
                      <p className="text-sm text-white truncate">{order.user_id.slice(0, 12)}...</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-300">{order.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons — only for pending */}
                  {order.status === 'pending' && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        disabled={processing === order.id}
                        onClick={() => handleAction(order, 'approved')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-bold text-sm transition-all hover:shadow-lg hover:shadow-green-500/20"
                      >
                        <CheckCircle size={15} />
                        {processing === order.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        disabled={processing === order.id}
                        onClick={() => setRejectModal({ orderId: order.id, userEmail: order.user_email || '', productName: order.products?.name || '' })}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-bold text-sm transition-all hover:shadow-lg hover:shadow-red-500/20"
                      >
                        <XCircle size={15} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleSkip(order.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm text-gray-300 transition-all"
                      >
                        <SkipForward size={15} />
                        Skip
                      </button>
                    </div>
                  )}
                </div>

                {/* Receipt Preview */}
                {order.screenshot_url && (
                  <div className="border-t lg:border-t-0 lg:border-l border-gray-800 p-6 flex flex-col items-center justify-center bg-gray-900/50">
                    <p className="text-xs text-gray-500 mb-3 uppercase font-medium tracking-wide">Payment Receipt</p>
                    <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={order.screenshot_url}
                        alt="Receipt"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <a
                      href={order.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      <ExternalLink size={12} />
                      View Full Size
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Reject Order</h3>
            <p className="text-gray-400 text-sm mb-4">
              Provide a reason — it will be sent to the customer via email.
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Product: <span className="font-semibold text-white">{rejectModal.productName}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID not found, screenshot unclear, amount mismatch..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
