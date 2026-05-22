'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, Printer } from 'lucide-react';

function TrackOrderContent() {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId) {
      setSearchId(orderId);
      fetchOrder(orderId);
    }
  }, [searchParams]);

  const fetchOrder = async (searchStr: string) => {
    setLoading(true);
    setError('');
    
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchStr);

      let orderQuery = supabase.from('orders').select('*');
      if (isUuid) {
        orderQuery = orderQuery.eq('id', searchStr);
      } else {
        orderQuery = orderQuery.eq('tracking_number', searchStr);
      }

      const { data: orderData, error: orderError } = await orderQuery.single();

      if (orderError || !orderData) {
        setError('Order not found. Please check your Order ID.');
        setLoading(false);
        return;
      }

      setOrder(orderData);

      const { data: trackingData } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: true });

      if (trackingData) {
        setTracking(trackingData);
      }
    } catch (err) {
      setError('Failed to fetch order. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/track?id=${searchId}`);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Received', icon: Clock },
      { status: 'approved', label: 'Payment Verified', icon: CheckCircle },
      { status: 'shipped', label: 'On the Way', icon: Truck },
      { status: 'delivered', label: 'Delivered', icon: Package },
    ];

    const currentIndex = steps.findIndex(s => s.status === order?.status);

    return (
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: String(((currentIndex + 1) / steps.length) * 100) + '%' }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentIndex;
            return (
              <div key={step.status} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <p className={`text-xs mt-2 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Track Your Order</h1>
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Order ID"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
              >
                <Search size={20} />
              </button>
            </div>
          </form>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Track Your Order</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 text-center mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-400">Customer</p>
                  <p className="font-semibold">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="font-semibold">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Delivery Address</p>
                  <p className="text-sm">{order.delivery_address}, {order.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="font-bold text-lg">Rs. {order.total_amount}</p>
                </div>
              </div>

              {order.tracking_number && (
                <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-gray-400">Tracking Number</p>
                  <p className="font-mono font-bold">{order.tracking_number}</p>
                </div>
              )}

            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Order Status</h2>
              {getStatusSteps()}
            </div>

            {tracking.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Tracking History</h2>
                <div className="space-y-4">
                  {tracking.map((track, index) => (
                    <div key={track.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                        {index < tracking.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-700" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold">{track.status.toUpperCase()}</p>
                        {track.message && (
                          <p className="text-sm text-gray-400">{track.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(track.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Track Your Order</h1>
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Enter Order ID"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            className="px-6 py-3 bg-blue-600 rounded-lg font-bold transition"
          >
            <Search size={20} />
          </button>
        </div>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TrackOrderContent />
    </Suspense>
  );
}