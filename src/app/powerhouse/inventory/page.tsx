'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Trash2, Plus, Package, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  description: string;
  price_pkr: number;
  discount_percent: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    description: '',
    price_pkr: '',
    discount_percent: '0',
    stock_quantity: '100',
    image_url: '',
    is_active: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
    }
    setProducts(data || []);
    setLoading(false);
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('active', true);
    setCategories(data || []);
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]);
  }, [fetchProducts]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);

    try {
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (dbError) throw dbError;

      await fetchProducts();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      price_pkr: product.price_pkr.toString(),
      discount_percent: product.discount_percent?.toString() || '0',
      stock_quantity: product.stock_quantity?.toString() || '100',
      image_url: product.image_url || '',
      is_active: product.is_active,
    });
    setFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewProduct({
      name: '',
      category_id: '',
      description: '',
      price_pkr: '',
      discount_percent: '0',
      stock_quantity: '100',
      image_url: '',
      is_active: true,
    });
    setFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price_pkr || !newProduct.category_id) {
      alert('Please fill all required fields.');
      return;
    }
    
    setIsUploading(true);
    try {
      let finalImageUrl = newProduct.image_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      const productData = {
        name: newProduct.name,
        category_id: newProduct.category_id || null,
        description: newProduct.description,
        price_pkr: Number(newProduct.price_pkr),
        discount_percent: Number(newProduct.discount_percent),
        stock_quantity: Number(newProduct.stock_quantity),
        image_url: finalImageUrl || null,
        is_active: newProduct.is_active,
      };

      if (editingId) {
        const { error: dbError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase.from('products').insert(productData);
        if (dbError) throw dbError;
      }

      handleCancel();
      await fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Product Inventory</h1>
          <p className="text-gray-400 mt-1">Manage your products and stock.</p>
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
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          {showForm ? 'Close Form' : <><Plus size={16} /> Add Product</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 ring-1 ring-blue-500/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              {editingId ? <Edit2 size={15} className="text-white" /> : <Upload size={15} className="text-white" />}
            </div>
            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Product Name *</label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. Physics Notes Chapter 1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category *</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition resize-none"
                rows={2}
                placeholder="Product description..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Price (PKR) *</label>
              <input
                type="number"
                required
                value={newProduct.price_pkr}
                onChange={(e) => setNewProduct({ ...newProduct, price_pkr: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newProduct.discount_percent}
                onChange={(e) => setNewProduct({ ...newProduct, discount_percent: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Stock Quantity</label>
              <input
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Image URL (Optional)</label>
              <input
                type="text"
                value={newProduct.image_url}
                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Status</label>
              <select
                value={newProduct.is_active ? 'active' : 'inactive'}
                onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.value === 'active' })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-green-500/20"
              >
                {isUploading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
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
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Package size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No products yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "Add Product" to create your first product.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Products ({products.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Discount</th>
                  <th className="px-6 py-3 text-left">Stock</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        (product as any).categories?.name 
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-800' 
                          : 'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}>
                        {(product as any).categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-medium">Rs. {product.price_pkr}</td>
                    <td className="px-6 py-4">
                      {product.discount_percent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-900/50 text-red-300 border border-red-800">
                          -{product.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{product.stock_quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        product.is_active ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-medium transition"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-lg text-xs font-medium transition disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}