'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import SecureViewer from '@/components/SecureViewer';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ViewContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isDeviceLocked, isLoading: authLoading } = useAuth();
  
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (isDeviceLocked) {
      setError('DEVICE_LOCKED');
      setLoading(false);
      return;
    }

    async function verifyAndFetch() {
      try {
        // 1. Check if the user has an approved order for this product
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('status, products(name, encrypted_content_url)')
          .eq('user_id', user?.id)
          .eq('product_id', id)
          .eq('status', 'approved')
          .single();

        if (orderError || !order) {
          setError('NO_ACCESS');
          setLoading(false);
          return;
        }

        const product = order.products as any;
        setProductName(product.name);

        // 2. Since bucket is private, we need a Signed URL (valid for 1 hour)
        // Extract the filename from the stored URL
        const urlObj = new URL(product.encrypted_content_url);
        const pathSegments = urlObj.pathname.split('/');
        const fileName = pathSegments[pathSegments.length - 1];

        const { data: signedData, error: signedError } = await supabase.storage
          .from('content')
          .createSignedUrl(fileName, 3600); // 1 hour

        if (signedError || !signedData) {
          throw new Error('Could not generate secure access link');
        }

        setContentUrl(signedData.signedUrl);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    verifyAndFetch();
  }, [id, user, isDeviceLocked, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error === 'DEVICE_LOCKED') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-950/20 border border-red-900 rounded-2xl p-8 text-center">
          <Lock size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-red-300 mb-6">
            Your account is locked to another device. You cannot view premium content from this device.
          </p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (error === 'NO_ACCESS') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Access</h1>
          <p className="text-gray-400 mb-6">
            You don't have an approved order for this content.
          </p>
          <Link href="/" className="px-6 py-2 bg-blue-600 rounded-lg font-bold">Go to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="p-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="font-bold text-white truncate max-w-xs md:max-w-md">{productName}</h1>
        <div className="w-16"></div> {/* Spacer */}
      </header>
      
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        {contentUrl && (
          <SecureViewer 
            url={contentUrl} 
            type={contentUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'pdf'} 
          />
        )}
      </main>
    </div>
  );
}
