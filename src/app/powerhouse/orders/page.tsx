'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, SkipForward, RefreshCw, Filter, Truck, Package, Printer, Trash2, AlertTriangle } from 'lucide-react';

type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled' | 'all';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string;
  city: string;
  postal_code: string | null;
  product_ids: string[];
  bundle_ids: string[] | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  transaction_id: string | null;
  screenshot_url: string | null;
  payment_method: string | null;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  item_details?: any;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ orderId: string; action: 'shipped' | 'delivered' | 'cancelled' } | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      console.log('Fetched orders:', data);
      setOrders(data as Order[]);
    }
    setSkipped(new Set());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (order: Order, newStatus: OrderStatus, notes?: string) => {
    setProcessing(order.id);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'shipped' && trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (notes) {
        await supabase.from('order_tracking').insert({
          order_id: order.id,
          status: newStatus,
          message: notes,
        });
      }

      await fetchOrders();
      setActionModal(null);
      setTrackingNumber('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleSkip = (orderId: string) => {
    setSkipped((prev) => new Set([...prev, orderId]));
  };

  const extractReceiptPath = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const marker = '/object/public/receipts/';
      const idx = url.indexOf(marker);
      if (idx !== -1) return url.substring(idx + marker.length);
    } catch {}
    return null;
  };

  const handleDeleteOrder = async (order: Order) => {
    setProcessing(order.id);
    try {
      // 1. Delete receipt from storage if exists
      const receiptPath = extractReceiptPath(order.screenshot_url);
      if (receiptPath) {
        await supabase.storage.from('receipts').remove([receiptPath]);
      }
      // 2. Delete tracking entries
      await supabase.from('order_tracking').delete().eq('order_id', order.id);
      // 3. Delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Failed to delete order.');
    } finally {
      setProcessing(null);
      setDeleteModal(null);
    }
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      // 1. Get all orders to find receipt URLs
      const { data: allOrders } = await supabase.from('orders').select('id, screenshot_url');
      if (allOrders && allOrders.length > 0) {
        // 2. Delete all receipts from storage
        const receiptPaths = allOrders
          .map((o) => extractReceiptPath(o.screenshot_url))
          .filter(Boolean) as string[];
        if (receiptPaths.length > 0) {
          await supabase.storage.from('receipts').remove(receiptPaths);
        }
        // 3. Delete all tracking entries
        await supabase.from('order_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // 4. Delete all orders
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      await fetchOrders();
    } catch (err) {
      console.error('Failed to reset:', err);
      alert('Failed to reset orders.');
    } finally {
      setResetting(false);
      setResetModal(false);
    }
  };

  const visibleOrders = orders.filter((o) => !skipped.has(o.id));

  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const filterTabs: { label: string; value: OrderStatus; color: string }[] = [
    { label: 'Pending', value: 'pending', color: 'border-yellow-500 text-yellow-400' },
    { label: 'Approved', value: 'approved', color: 'border-green-500 text-green-400' },
    { label: 'Shipped', value: 'shipped', color: 'border-blue-500 text-blue-400' },
    { label: 'Delivered', value: 'delivered', color: 'border-purple-500 text-purple-400' },
    { label: 'Cancelled', value: 'cancelled', color: 'border-red-500 text-red-400' },
    { label: 'All Orders', value: 'all', color: 'border-gray-500 text-gray-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Order Management</h1>
          <p className="text-gray-400 mt-1">Process and track customer orders.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setResetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-lg text-sm text-red-400 font-bold transition"
          >
            <Trash2 size={14} />
            Reset All
          </button>
        </div>
      </div>

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

      {skipped.size > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-yellow-400 text-sm">
            {skipped.size} order(s) skipped
          </p>
          <button
            onClick={() => setSkipped(new Set())}
            className="text-yellow-400 hover:text-yellow-300 text-xs underline"
          >
            Restore all
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Filter size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No {filter === 'all' ? '' : filter} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{order.customer_name}</h3>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">Order #{order.tracking_number || order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPrintOrder(order);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-bold text-gray-300 border border-gray-700 flex items-center gap-1 transition"
                    >
                      <Printer size={12} />
                      Print Label
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                    order.status === 'approved' ? 'bg-green-900/30 text-green-400 border-green-800' :
                    order.status === 'shipped' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                    order.status === 'delivered' ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                    'bg-red-900/30 text-red-400 border-red-800'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-white">{order.customer_phone}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">City</p>
                    <p className="font-medium text-white">{order.city}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="font-bold text-white">Rs. {order.total_amount}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="font-medium text-blue-400">{order.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-800/40 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-300">{order.delivery_address}</p>
                </div>

                {/* Order Items */}
                <div className="bg-gray-800/40 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Order Items</p>
                  {order.item_details && Array.isArray(order.item_details) && order.item_details.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {order.item_details.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-gray-300 border-b border-gray-700/50 pb-1 last:border-0 last:pb-0">
                          <span>{item.quantity}x {item.name}</span>
                          <span>Rs. {((item.price * (1 - (item.discountPercent || 0) / 100)) * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Item details not available (Legacy order)</p>
                  )}
                </div>

                {order.screenshot_url && (
                  <div className="bg-gray-800/40 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Payment Proof</p>
                    <a 
                      href={order.screenshot_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block"
                    >
                      <img 
                        src={order.screenshot_url} 
                        alt="Payment Receipt" 
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-700 hover:border-blue-500 transition cursor-zoom-in"
                      />
                    </a>
                    <p className="text-xs text-gray-500 mt-2">Transaction ID: <span className="font-mono">{order.transaction_id || 'N/A'}</span></p>
                  </div>
                )}

                {order.tracking_number && (
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-400 font-medium mb-1">Tracking Number</p>
                    <p className="font-mono text-sm text-white">{order.tracking_number}</p>
                  </div>
                )}

                {order.notes && (
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-400 font-medium mb-1">Admin Notes</p>
                    <p className="text-sm text-red-300">{order.notes}</p>
                  </div>
                )}

                {order.status === 'pending' && (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      disabled={processing === order.id}
                      onClick={() => handleAction(order, 'approved')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-bold text-sm transition"
                    >
                      <CheckCircle size={15} />
                      Approve
                    </button>
                    <button
                      disabled={processing === order.id}
                      onClick={() => handleAction(order, 'cancelled')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-bold text-sm transition"
                    >
                      <XCircle size={15} />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSkip(order.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm text-gray-300 transition"
                    >
                      <SkipForward size={15} />
                      Skip
                    </button>
                  </div>
                )}

                {order.status === 'approved' && (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      disabled={processing === order.id}
                      onClick={() => setActionModal({ orderId: order.id, action: 'shipped' })}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold text-sm transition"
                    >
                      <Truck size={15} />
                      Mark as Shipped
                    </button>
                    <button
                      onClick={() => handleSkip(order.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm text-gray-300 transition"
                    >
                      <SkipForward size={15} />
                      Skip
                    </button>
                  </div>
                )}

                {order.status === 'shipped' && (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      disabled={processing === order.id}
                      onClick={() => handleAction(order, 'delivered')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-bold text-sm transition"
                    >
                      <Package size={15} />
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => handleSkip(order.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm text-gray-300 transition"
                    >
                      <SkipForward size={15} />
                      Skip
                    </button>
                  </div>
                )}

                {/* Delete Order - always visible */}
                <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-gray-800">
                  <button
                    disabled={processing === order.id}
                    onClick={() => setDeleteModal(order.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-lg text-red-400 text-sm font-medium transition"
                  >
                    <Trash2 size={14} />
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Order?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">This will permanently delete this order and its receipt from storage. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const order = orders.find(o => o.id === deleteModal);
                  if (order) handleDeleteOrder(order);
                }}
                disabled={processing === deleteModal}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {processing === deleteModal ? 'Deleting...' : 'Delete Forever'}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Confirmation Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400">⚠️ Nuclear Reset</h3>
            </div>
            <p className="text-gray-400 text-sm mb-2">This will <span className="text-red-400 font-bold">permanently delete ALL orders, tracking history, and receipt uploads</span> from your database and storage.</p>
            <p className="text-red-400 text-xs font-bold mb-6">THIS CANNOT BE UNDONE. All statistics will be reset to zero.</p>
            <div className="flex gap-3">
              <button
                onClick={handleResetAll}
                disabled={resetting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {resetting ? 'Resetting Everything...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setResetModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionModal.action === 'shipped' ? 'Mark as Shipped' : 'Mark as Delivered'}
            </h3>
            {actionModal.action === 'shipped' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Tracking Number (Optional)</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter tracking number"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleAction(
                    orders.find(o => o.id === actionModal.orderId)!,
                    actionModal.action,
                    actionModal.action === 'shipped' ? 'Order shipped' : 'Order delivered'
                  );
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
              >
                Confirm
              </button>
              <button
                onClick={() => { setActionModal(null); setTrackingNumber(''); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Delivery Label */}
      {printOrder && (
        <div className="hidden print:block fixed inset-0 bg-white text-black z-[100] p-8">
          <div className="max-w-2xl mx-auto border-4 border-black p-8">
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
              <div>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter">CamRigged</h1>
                <p className="text-sm mt-1 font-bold">Premium Notes & Student Essentials</p>
                <p className="text-sm">Returns: info@camrigged.com</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">Shipping Date</p>
                <p className="text-xl font-bold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-bold text-gray-600 tracking-widest uppercase mb-2">Ship To</p>
              <h2 className="text-3xl font-bold mb-2">{printOrder.customer_name}</h2>
              <p className="text-xl leading-relaxed max-w-md">{printOrder.delivery_address}</p>
              <p className="text-xl font-bold mt-1">{printOrder.city}{printOrder.postal_code ? `, ${printOrder.postal_code}` : ''}</p>
              <p className="text-xl mt-4"><span className="font-bold">Phone:</span> {printOrder.customer_phone}</p>
            </div>

            <div className="border-t-2 border-black pt-6 mb-8 flex justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 tracking-widest uppercase mb-1">Order Details</p>
                <p className="text-lg"><span className="font-bold">Order ID:</span> {printOrder.tracking_number || printOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-lg"><span className="font-bold">Amount:</span> Rs. {printOrder.total_amount}</p>
                <p className="text-lg"><span className="font-bold">Payment:</span> {printOrder.payment_method?.replace('_', ' ').toUpperCase() || 'COD'}</p>
              </div>
            </div>

            {printOrder.item_details && Array.isArray(printOrder.item_details) && (
              <div className="border-t-2 border-black pt-6">
                <p className="text-sm font-bold text-gray-600 tracking-widest uppercase mb-3">Packing Slip</p>
                <ul className="text-sm">
                  {printOrder.item_details.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                      <span><span className="font-bold mr-2">{item.quantity}x</span> {item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}