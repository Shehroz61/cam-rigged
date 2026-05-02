'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState('jazzcash_account');
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  
  const { items, clearCart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (data && !error) {
        const settingsMap: Record<string, string> = {};
        data.forEach((s) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !file || items.length === 0) {
      alert('Please fill all fields and ensure your cart is not empty.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        alert('You must be logged in to checkout.');
        setIsSubmitting(false);
        return;
      }
      const userId = userData.user.id;

      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
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

      // Create orders
      const ordersToInsert = items.map(item => ({
        user_id: userId,
        product_id: item.id,
        amount: item.price_pkr, // Using PKR for manual checkout default for now
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: 'pending',
      }));

      const { error: orderError } = await supabase.from('orders').insert(ordersToInsert);

      if (orderError) {
        throw new Error('Failed to create order.');
      }

      // Fire confirmation email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_received',
            toEmail: userData.user.email || '',
            productName: items.map((i) => i.name).join(', '),
            amount: items.reduce((s, i) => s + i.price_pkr, 0),
            transactionId,
            orderId: '',
          }),
        });
      } catch (_) {
        // Email failure shouldn't block success
      }

      setStatus('success');
      clearCart();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Verification in Progress</h2>
          <p className="text-gray-300">
            We have received your payment details. Please wait while our team verifies your transaction. 
            This usually takes up to 24 hours.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Payment Instructions */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Manual Payment</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Please transfer the total amount using one of the methods below, then submit your transaction ID and receipt screenshot.
          </p>

          <div className="space-y-4">
            <div className={`p-4 rounded border ${paymentMethod === 'jazzcash_account' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'} cursor-pointer`} onClick={() => setPaymentMethod('jazzcash_account')}>
              <h3 className="font-semibold text-blue-400">JazzCash</h3>
              <p className="text-gray-300">{settings.jazzcash_account || 'Loading...'}</p>
            </div>
            <div className={`p-4 rounded border ${paymentMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'} cursor-pointer`} onClick={() => setPaymentMethod('bank_transfer')}>
              <h3 className="font-semibold text-blue-400">Bank Transfer</h3>
              <p className="text-gray-300">{settings.bank_transfer || 'Loading...'}</p>
            </div>
            <div className={`p-4 rounded border ${paymentMethod === 'usdt_trc20' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700'} cursor-pointer`} onClick={() => setPaymentMethod('usdt_trc20')}>
              <h3 className="font-semibold text-blue-400">USDT (TRC20)</h3>
              <p className="text-gray-300 break-all">{settings.usdt_trc20 || 'Loading...'}</p>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Confirm Payment</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Cart Summary</h3>
            {items.length === 0 ? (
              <p className="text-red-400 text-sm">Your cart is empty.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between border-b border-gray-700 pb-1">
                    <span>{item.name}</span>
                    <span>Rs. {item.price_pkr}</span>
                  </li>
                ))}
                <li className="flex justify-between font-bold pt-2">
                  <span>Total:</span>
                  <span>Rs. {items.reduce((sum, item) => sum + item.price_pkr, 0)}</span>
                </li>
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Transaction ID (TID)</label>
              <input 
                type="text" 
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. 1234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload Receipt (Screenshot)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || items.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
