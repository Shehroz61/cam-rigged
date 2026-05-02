'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, useCartStore } from '@/store/cartStore';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, LogOut, Zap } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const { items, addToCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'All' | 'O Level' | 'A Level'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Single' | 'Bundle'>('All');

  const ADMIN_EMAIL = 'shehrozhameed61@gmail.com';
  const isAdmin = user?.email === ADMIN_EMAIL || user?.email?.startsWith('shehrozhameed61+');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const catOk = filterCategory === 'All' || p.category === filterCategory;
    const typeOk = filterType === 'All' || p.type === filterType;
    return catOk && typeOk;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            CamRigged
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/powerhouse"
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 px-3 py-2 rounded-lg transition"
                  >
                    <Zap size={14} />
                    Powerhouse
                  </Link>
                )}
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition">
                Login / Sign Up
              </Link>
            )}
            <Link href="/checkout" className="relative group">
              <div className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 transition rounded-full font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm">
                <ShoppingCart size={14} />
                <span>Cart</span>
                {items.length > 0 && (
                  <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-extrabold">
                    {items.length}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-gray-900 to-gray-900" />
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
          Ace Your Exams with <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
            Premium Notes
          </span>
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-gray-400 mb-10">
          The ultimate O Level and A Level study materials, bundled for success. Start your journey to straight A*s today.
        </p>
        <div className="flex gap-4">
          <a
            href="#products"
            className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Explore Collection
          </a>
          {!user && (
            <Link
              href="/signup"
              className="px-8 py-3 border border-gray-600 text-gray-300 font-bold rounded-full hover:border-gray-400 hover:text-white transition"
            >
              Sign Up Free
            </Link>
          )}
        </div>
      </header>

      {/* Product Grid */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-3xl font-bold">Our Resources</h2>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'O Level', 'A Level'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  filterCategory === c
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
            <div className="w-px bg-gray-700 mx-1" />
            {(['All', 'Single', 'Bundle'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  filterType === t
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">No products found.</p>
            <p className="mt-2 text-sm">
              {products.length === 0 ? 'Admins: Head to the Powerhouse to add inventory!' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product) => {
              const inCart = items.some((item) => item.id === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        product.category === 'A Level'
                          ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                          : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                      }`}
                    >
                      {product.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        product.type === 'Bundle'
                          ? 'bg-amber-900/50 text-amber-300 border border-amber-700'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 flex-grow">
                    {product.description || 'Premium study resource tailored for top grades.'}
                  </p>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-2xl font-bold text-white">Rs. {product.price_pkr}</p>
                      <p className="text-sm text-gray-500">${product.price_usdt} USDT</p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={inCart}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      inCart
                        ? 'bg-green-900/50 text-green-400 border border-green-700 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                    }`}
                  >
                    {inCart ? '✓ Added to Cart' : `Add to ${product.type === 'Bundle' ? 'Bundle' : 'Cart'}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20 text-center text-gray-500">
        <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
          CamRigged
        </p>
        <p className="text-sm mb-4">Premium O & A Level Study Resources</p>
        <div className="flex justify-center gap-6 text-sm mb-6">
          <Link href="/dashboard" className="hover:text-gray-300 transition">My Dashboard</Link>
          <Link href="/checkout" className="hover:text-gray-300 transition">Checkout</Link>
          <a href="mailto:support@camrigged.com" className="hover:text-gray-300 transition">Support</a>
        </div>
        <p>© {new Date().getFullYear()} CamRigged. All rights reserved.</p>
      </footer>
    </div>
  );
}
