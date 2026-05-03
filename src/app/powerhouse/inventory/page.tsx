'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Trash2, FileText, Video, Plus, Package, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price_pkr: number;
  price_usdt: number;
  type: string;
  encrypted_content_url: string | null;
  created_at: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'O Level',
    description: '',
    price_pkr: '',
    price_usdt: '',
    type: 'Single',
  });
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    console.log("Attempting to delete product:", product.id);

    try {
      // 1. Delete file from storage if it exists
      if (product.encrypted_content_url) {
        try {
          const url = new URL(product.encrypted_content_url);
          // More robust way to get the filename regardless of public/private path
          const pathSegments = url.pathname.split('/');
          const fileName = pathSegments[pathSegments.length - 1];
          
          console.log("Attempting to delete file from storage:", fileName);
          const { error: storageError } = await supabase.storage
            .from('content')
            .remove([fileName]);
          
          if (storageError) {
            console.error("Storage deletion error:", storageError);
            // We continue anyway to try and delete the DB record
          } else {
            console.log("File deleted from storage successfully");
          }
        } catch (urlErr) {
          console.error("Error parsing URL for deletion:", urlErr);
        }
      }

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (dbError) {
        throw dbError;
      }

      console.log("Product deleted from database successfully");
      await fetchProducts();
    } catch (err: any) {
      console.error("Full deletion error:", err);
      alert(`Failed to delete: ${err.message || "Check console for details"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      category: product.category,
      description: product.description || '',
      price_pkr: product.price_pkr.toString(),
      price_usdt: product.price_usdt.toString(),
      type: product.type,
    });
    setFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewProduct({ name: '', category: 'O Level', description: '', price_pkr: '', price_usdt: '', type: 'Single' });
    setFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // File is required only for NEW products
    if (!newProduct.name || !newProduct.price_pkr || !newProduct.price_usdt) {
      alert('Please fill all required fields.');
      return;
    }
    
    if (!editingId && !file) {
      alert('Please attach a file for new content.');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = editingId ? products.find(p => p.id === editingId)?.encrypted_content_url || null : null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('content').upload(fileName, file);
        if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('content').getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }

      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        description: newProduct.description,
        price_pkr: Number(newProduct.price_pkr),
        price_usdt: Number(newProduct.price_usdt),
        type: newProduct.type,
        encrypted_content_url: finalUrl,
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

  const getFileIcon = (url: string | null) => {
    if (!url) return <FileText size={14} className="text-gray-500" />;
    if (url.match(/\.(mp4|mov|avi|webm)$/i)) return <Video size={14} className="text-blue-400" />;
    return <FileText size={14} className="text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Inventory</h1>
          <p className="text-gray-400 mt-1">Manage your study resource catalog.</p>
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

      {/* Upload Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 ring-1 ring-blue-500/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              {editingId ? <Edit2 size={15} className="text-white" /> : <Upload size={15} className="text-white" />}
            </div>
            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Product' : 'Upload New Content'}</h2>
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
                placeholder="e.g. O Level Physics Paper 1 Notes"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option>O Level</option>
                <option>A Level</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition resize-none"
                rows={2}
                placeholder="Brief description of the content..."
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
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Price (USDT) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={newProduct.price_usdt}
                onChange={(e) => setNewProduct({ ...newProduct, price_usdt: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. 5.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Type *</label>
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option>Single</option>
                <option>Bundle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Content File {editingId ? '(Optional)' : '(PDF/Video) *'}
              </label>
              <input
                type="file"
                required={!editingId}
                accept=".pdf,.mp4,.mov,.avi,.webm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
              />
              {editingId && (
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current file.</p>
              )}
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-green-500/20"
              >
                {isUploading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product to Store'}
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

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Package size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No products yet</p>
          <p className="text-gray-600 text-sm mt-1">Click &quot;Add Product&quot; to upload your first resource.</p>
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
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">PKR</th>
                  <th className="px-6 py-3 text-left">USDT</th>
                  <th className="px-6 py-3 text-left">File</th>
                  <th className="px-6 py-3 text-left">Added</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        product.category === 'A Level'
                          ? 'bg-purple-900/50 text-purple-300 border border-purple-800'
                          : 'bg-blue-900/50 text-blue-300 border border-blue-800'
                      }`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        product.type === 'Bundle'
                          ? 'bg-amber-900/50 text-amber-300 border border-amber-800'
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-medium">Rs. {product.price_pkr}</td>
                    <td className="px-6 py-4 text-gray-300">${product.price_usdt}</td>
                    <td className="px-6 py-4">
                      {product.encrypted_content_url ? (
                        <a
                          href={product.encrypted_content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition"
                        >
                          {getFileIcon(product.encrypted_content_url)}
                          <span className="text-xs">View</span>
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(product.created_at).toLocaleDateString()}
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
