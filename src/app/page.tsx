'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { ShoppingCart, Package, TrendingUp, LayoutGrid, List, Sparkles } from 'lucide-react';
import ProductModal from '@/components/ProductModal';
import Image from 'next/image';

export default function Home() {
  const { items, addToCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchData() {
      const productsRes = await supabase.from('products').select('*, categories(name)').eq('is_active', true).order('created_at', { ascending: false });
      const bundlesRes = await supabase.from('bundles').select('*, bundle_products(product_id, products(name, price_pkr, description, categories(name)))').order('created_at', { ascending: false });
      const categoriesRes = await supabase.from('categories').select('*').eq('active', true).order('name');

      if (productsRes.data) setProducts(productsRes.data);
      if (bundlesRes.data) setBundles(bundlesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const catOk = selectedCategory === 'all' || p.category_id === selectedCategory;
    const searchOk = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catOk && searchOk;
  });

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            CamRigged
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/track" className="text-sm text-gray-300 hover:text-white transition">
              Track Order
            </Link>
            <Link href="/checkout" className="relative group">
              <div className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 transition rounded-full font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm">
                <ShoppingCart size={14} />
                <span>Cart</span>
                {items.length > 0 && (
                  <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-extrabold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
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
          Premium Notes & <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
            Student Essentials
          </span>
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-gray-400 mb-10">
          Get physical copies of study notes delivered to your doorstep. Plus snacks, stationery, and more!
        </p>
        <div className="flex gap-4">
          <a
            href="#products"
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            Shop Now
          </a>
          <a
            href="#bundles"
            className="px-8 py-3 border border-purple-600 text-purple-300 font-bold rounded-full hover:bg-purple-600/20 transition"
          >
            View Bundles
          </a>
        </div>
      </header>

      {/* Search and Filter */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedCategory === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedCategory === cat.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {/* Bundles Section */}
      {filteredBundles.length > 0 && (
        <section id="bundles" className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-400" />
            Special Bundles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-6 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(147,51,234,0.2)] transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700">
                    Bundle - Save {bundle.discount_percent}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-purple-300">{bundle.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{bundle.description}</p>
                {/* Calculate bundle original and discounted price */}
                {(() => {
                  const originalPrice = bundle.bundle_products?.reduce((sum: number, bp: any) => sum + (bp.products?.price_pkr || 0), 0) || 0;
                  const finalPrice = originalPrice * (1 - (bundle.discount_percent || 0) / 100);
                  return (
                    <div className="mb-4">
                      {bundle.discount_percent > 0 && (
                        <p className="text-sm text-gray-500 line-through">Rs. {originalPrice.toFixed(2)}</p>
                      )}
                      <p className="text-2xl font-bold text-white mb-2">
                        Rs. {finalPrice.toFixed(2)}
                      </p>
                    </div>
                  );
                })()}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Includes:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {bundle.bundle_products?.slice(0, 3).map((bp: any, idx: number) => (
                      <li key={idx}>• {bp.products?.name || 'Item'}</li>
                    ))}
                    {bundle.bundle_products?.length > 3 && (
                      <li className="text-gray-500">+ {bundle.bundle_products.length - 3} more items</li>
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    const bundleData = {
                      id: bundle.id,
                      name: bundle.name,
                      description: bundle.description,
                      discount_percent: bundle.discount_percent,
                      products: bundle.bundle_products?.map((bp: any) => bp.products) || [],
                    };
                    useCartStore.getState().addBundleToCart(bundleData);
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition"
                >
                  Add Bundle to Cart
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Grid */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={28} />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">The Drop</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">Fresh picks, no cap 🔥</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-800/80 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">No products found.</p>
            <p className="mt-2 text-sm">Try adjusting your filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredProducts.map((product) => {
              const inCart = items.some((item) => item.id === product.id);
              const finalPrice = product.price_pkr * (1 - (product.discount_percent || 0) / 100);
              return (
                <div
                  key={product.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-3 sm:p-6 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.image_url && (
                    <div className="relative w-full h-32 sm:h-48 mb-3 sm:mb-4">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover rounded-xl"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${(product as any).categories?.name
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}>
                      {(product as any).categories?.name || 'Uncategorized'}
                    </span>
                    {product.discount_percent > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700">
                        -{product.discount_percent}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6 flex-grow line-clamp-2 hidden sm:block">
                    {product.description || 'High-quality product for students.'}
                  </p>

                  <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <div>
                      {product.discount_percent > 0 && (
                        <p className="text-[10px] sm:text-sm text-gray-500 line-through">Rs. {product.price_pkr}</p>
                      )}
                      <p className="text-lg sm:text-2xl font-bold text-white">
                        Rs. {product.discount_percent > 0 ? finalPrice.toFixed(0) : product.price_pkr}
                      </p>
                      {product.stock_quantity && product.stock_quantity < 10 && (
                        <p className="text-[10px] sm:text-xs text-red-400 mt-0.5">Only {product.stock_quantity} left!</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={inCart}
                    className={`w-full py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${inCart
                        ? 'bg-green-900/50 text-green-400 border border-green-700 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                  >
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const inCart = items.some((item) => item.id === product.id);
              const finalPrice = product.price_pkr * (1 - (product.discount_percent || 0) / 100);
              return (
                <div
                  key={product.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 hover:border-blue-500/50 transition-all duration-300 flex gap-4 items-center cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.image_url && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(product as any).categories?.name
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}>
                        {(product as any).categories?.name || 'Uncategorized'}
                      </span>
                      {product.discount_percent > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-700">
                          -{product.discount_percent}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {product.discount_percent > 0 && (
                        <span className="text-xs text-gray-500 line-through">Rs. {product.price_pkr}</span>
                      )}
                      <span className="text-base sm:text-lg font-bold text-white">
                        Rs. {product.discount_percent > 0 ? finalPrice.toFixed(0) : product.price_pkr}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={inCart}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 transition-all ${inCart
                        ? 'bg-green-900/50 text-green-400 border border-green-700 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    {inCart ? '✓' : '+ Add'}
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
        <p className="text-sm mb-4">Premium Notes & Student Essentials Delivery</p>
        <div className="flex justify-center gap-6 text-sm mb-6">
          <Link href="/track" className="hover:text-gray-300 transition">Track Order</Link>
          <Link href="/checkout" className="hover:text-gray-300 transition">Checkout</Link>
          <a href="mailto:support@camrigged.com" className="hover:text-gray-300 transition">Support</a>
        </div>
        <p>© {new Date().getFullYear()} CamRigged. All rights reserved.</p>
      </footer>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => {
            addToCart(p);
            setSelectedProduct(null);
          }}
          inCart={items.some((item) => item.id === selectedProduct.id)}
        />
      )}
    </div>
  );
}