'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, MapPin, CreditCard } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CheckoutPage() {
  const { items, removeFromCart, updateQuantity, getTotal } = useCartStore();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<{id: string, name: string, details: string}[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('jazzcash_account');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const [orderId, setOrderId] = useState<string>('');
  const [orderSnapshot, setOrderSnapshot] = useState<any>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((s) => {
          settingsMap[s.key] = s.value;
          if (s.key === 'payment_methods') {
            try {
              const methods = JSON.parse(s.value);
              setPaymentMethods(methods);
              if (methods.length > 0) {
                setPaymentMethod(methods[0].id); // Default to first available dynamic method
              }
            } catch (e) {
              console.error("Failed to parse payment methods", e);
            }
          }
        });
        setSettings(settingsMap);
      }
    }
    fetchSettings();
  }, []);

  const subtotal = getTotal();
  const shippingCost = parseFloat(settings.shipping_cost || '100');
  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || '2000');
  const minOrderThreshold = parseFloat(settings.min_order_amount || '200');
  const finalShipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
  const total = subtotal + finalShipping;
  const meetsMinOrder = subtotal >= minOrderThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !deliveryAddress || !city) {
      alert('Please fill all required delivery fields.');
      return;
    }

    if (!meetsMinOrder) {
      alert(`Minimum order amount is Rs. ${minOrderThreshold}. Your current subtotal is Rs. ${subtotal.toFixed(2)}.`);
      return;
    }

    if (!file) {
      alert('Please provide receipt screenshot.');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error('Failed to upload receipt.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const screenshotUrl = publicUrlData.publicUrl;

      const productIds: string[] = [];
      const bundleIds: string[] = [];

      items.forEach(item => {
        if (item.type === 'product') {
          productIds.push(item.id);
        } else if (item.type === 'bundle') {
          bundleIds.push(item.id);
        }
      });

      const trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
      const orderId = crypto.randomUUID();

      const orderData = {
        id: orderId,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        city: city,
        postal_code: postalCode || null,
        product_ids: productIds,
        bundle_ids: bundleIds.length > 0 ? bundleIds : null,
        item_details: items,
        subtotal: subtotal,
        discount_amount: 0,
        total_amount: total,
        screenshot_url: screenshotUrl,
        payment_method: paymentMethods.find(m => m.id === paymentMethod)?.name || paymentMethod,
        status: 'pending',
        tracking_number: trackingNumber,
      };

      const { error: orderError } = await supabase.from('orders').insert([orderData]);

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Create tracking entry
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'pending',
        message: 'Order received, awaiting verification',
      });

      // Store order ID in state for success page
      setOrderSnapshot({
        id: orderId,
        items: [...items],
        subtotal,
        finalShipping,
        total,
        customerName,
        deliveryAddress,
        city,
        postalCode,
        customerPhone,
        customerEmail,
        paymentMethod
      });
      setStatus('success');
      setOrderId(trackingNumber);
      useCartStore.getState().clearCart();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success' && orderSnapshot) {
    const shortOrderId = orderId ? orderId.slice(0, 8) : '';
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-2xl w-full mb-8 print:hidden">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-300 mb-2">
            Your Order ID:
          </p>
          <p className="text-2xl font-mono font-bold text-white mb-6 bg-gray-900 py-3 px-4 rounded-lg inline-block w-full">
            {orderId}
          </p>
          <p className="text-gray-300 mb-6">
            Save this ID to track your order. We will verify your payment and deliver the products to your address.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push(`/track?id=${orderId}`)}
              className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition"
            >
              Track Order
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Cart Summary
              </h2>

              {items.length === 0 ? (
                <p className="text-gray-400">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-700 pb-4">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          Rs. {((item.price * (1 - (item.discountPercent || 0) / 100)) * item.quantity).toFixed(2)}
                          {item.discountPercent && item.discountPercent > 0 && (
                            <span className="text-red-400 ml-2">(-{item.discountPercent}%)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1 bg-gray-700 rounded hover:bg-gray-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-gray-700 rounded hover:bg-gray-600"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-400 hover:text-red-300 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Payment Method
              </h2>
              <div className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-lg border cursor-pointer ${paymentMethod === method.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
                        }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <p className="font-semibold text-blue-400">{method.name}</p>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">{method.details}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer ${paymentMethod === 'jazzcash_account' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
                        }`}
                      onClick={() => setPaymentMethod('jazzcash_account')}
                    >
                      <p className="font-semibold text-blue-400">JazzCash</p>
                      <p className="text-sm text-gray-400">{settings.jazzcash_account}</p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer ${paymentMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
                        }`}
                      onClick={() => setPaymentMethod('bank_transfer')}
                    >
                      <p className="font-semibold text-blue-400">{settings.custom_bank_name || 'Bank Transfer'}</p>
                      <p className="text-sm text-gray-400">{settings.custom_bank_details || settings.bank_transfer}</p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer ${paymentMethod === 'usdt_trc20' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'
                        }`}
                      onClick={() => setPaymentMethod('usdt_trc20')}
                    >
                      <p className="font-semibold text-blue-400">USDT (TRC20)</p>
                      <p className="text-sm text-gray-400 break-all">{settings.usdt_trc20}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Delivery Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Delivery Address *</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Postal Code (Optional)</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">Payment Confirmation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Receipt Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {!meetsMinOrder && (
                  <p className="text-xs text-red-400">
                    Add Rs. {(minOrderThreshold - subtotal).toFixed(2)} more to meet minimum order!
                  </p>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span>{finalShipping === 0 ? 'Free' : `Rs. ${finalShipping.toFixed(2)}`}</span>
                </div>
                {freeShippingThreshold > 0 && subtotal < freeShippingThreshold && meetsMinOrder && (
                  <p className="text-xs text-gray-500">
                    Add Rs. {(freeShippingThreshold - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0 || !meetsMinOrder}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25"
            >
              {isSubmitting ? 'Placing Order...' : !meetsMinOrder ? `Add Rs. ${(minOrderThreshold - subtotal).toFixed(2)} More` : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}