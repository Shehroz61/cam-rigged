'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Package, Tag } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  bundle_products?: { product_id: string; products: { name: string } }[];
}

interface Product {
  id: string;
  name: string;
  price_pkr: number;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [newBundle, setNewBundle] = useState({
    name: '',
    description: '',
    discount_percent: '0',
    is_active: true,
  });

  const fetchBundles = async () => {
    const { data, error } = await supabase
      .from('bundles')
      .select('*, bundle_products(product_id, products(name, price_pkr, categories(name)))')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bundles:', error);
    }
    console.log('Fetched bundles:', data);
    setBundles(data || []);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price_pkr')
      .eq('is_active', true);
    setProducts(data || []);
  };

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchBundles(), fetchProducts()]);
    }
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      await supabase.from('bundles').delete().eq('id', id);
      await fetchBundles();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingId(bundle.id);
    setNewBundle({
      name: bundle.name,
      description: bundle.description || '',
      discount_percent: bundle.discount_percent?.toString() || '0',
      is_active: bundle.is_active,
    });
    setSelectedProducts(bundle.bundle_products?.map(bp => bp.product_id) || []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewBundle({ name: '', description: '', discount_percent: '0', is_active: true });
    setSelectedProducts([]);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBundle.name || selectedProducts.length === 0) {
      alert('Please fill all required fields and select at least one product.');
      return;
    }

    try {
      if (editingId) {
        await supabase.from('bundles').update({
          name: newBundle.name,
          description: newBundle.description,
          discount_percent: Number(newBundle.discount_percent),
          is_active: newBundle.is_active,
        }).eq('id', editingId);

        await supabase.from('bundle_products').delete().eq('bundle_id', editingId);
        const insertData = selectedProducts.map(product_id => ({ bundle_id: editingId, product_id }));
        await supabase.from('bundle_products').insert(insertData);
      } else {
        const { data: bundle } = await supabase
          .from('bundles')
          .insert({
            name: newBundle.name,
            description: newBundle.description,
            discount_percent: Number(newBundle.discount_percent),
            is_active: newBundle.is_active,
          })
          .select()
          .single();

        if (bundle) {
          const insertData = selectedProducts.map(product_id => ({ 
            bundle_id: bundle.id, 
            product_id 
          }));
          await supabase.from('bundle_products').insert(insertData);
        }
      }

      handleCancel();
      await fetchBundles();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Bundle Management</h1>
          <p className="text-gray-400 mt-1">Create discount bundles from multiple products.</p>
        </div>
        <button
          onClick={() => {
            if (showForm && editingId) {
              handleCancel();
            } else {
              setShowForm(!showForm);
              if (!showForm) setEditingId(null);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          {showForm ? 'Close Form' : <><Plus size={16} /> Create Bundle</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-purple-700 rounded-2xl p-6 ring-1 ring-purple-500/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              {editingId ? <Edit2 size={15} className="text-white" /> : <Tag size={15} className="text-white" />}
            </div>
            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Bundle' : 'Create New Bundle'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Bundle Name *</label>
                <input
                  type="text"
                  required
                  value={newBundle.name}
                  onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. Complete Physics Bundle"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Discount (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newBundle.discount_percent}
                  onChange={(e) => setNewBundle({ ...newBundle, discount_percent: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={newBundle.description}
                  onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition resize-none"
                  rows={2}
                  placeholder="Bundle description..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Select Products *</label>
                <div className="max-h-48 overflow-y-auto bg-gray-800 border border-gray-700 rounded-xl p-4">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-3 py-2 hover:bg-gray-700 rounded-lg px-2 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="flex-1 text-white">{product.name}</span>
                      <span className="text-gray-400 text-sm">Rs. {product.price_pkr}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedProducts.length} product(s) selected</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Status</label>
                <select
                  value={newBundle.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setNewBundle({ ...newBundle, is_active: e.target.value === 'active' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-purple-500/20"
              >
                {editingId ? 'Update Bundle' : 'Create Bundle'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Tag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No bundles yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "Create Bundle" to make your first bundle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  bundle.is_active 
                    ? 'bg-green-900/50 text-green-400 border border-green-700'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {bundle.is_active ? 'Active' : 'Inactive'}
                </span>
                {bundle.discount_percent > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700">
                    Save {bundle.discount_percent}%
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-300">{bundle.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{bundle.description}</p>
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Products:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {bundle.bundle_products?.slice(0, 3).map((bp, idx) => (
                    <li key={idx}>• {bp.products?.name || 'Item'}</li>
                  ))}
                  {bundle.bundle_products?.length > 3 && (
                    <li className="text-gray-500">+ {bundle.bundle_products.length - 3} more</li>
                  )}
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(bundle)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-medium transition"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bundle.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-lg text-xs font-medium transition"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}