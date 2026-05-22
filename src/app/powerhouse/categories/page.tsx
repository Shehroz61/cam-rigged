'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Tag, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    active: true,
  });

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will be uncategorized.')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      await fetchCategories();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setNewCategory({
      name: category.name,
      description: category.description || '',
      active: category.active,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewCategory({ name: '', description: '', active: true });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      alert('Please enter a category name.');
      return;
    }

    try {
      if (editingId) {
        await supabase.from('categories').update({
          name: newCategory.name,
          description: newCategory.description,
          active: newCategory.active,
        }).eq('id', editingId);
      } else {
        await supabase.from('categories').insert({
          name: newCategory.name,
          description: newCategory.description,
          active: newCategory.active,
        });
      }

      handleCancel();
      await fetchCategories();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Category Management</h1>
          <p className="text-gray-400 mt-1">Organize your products with categories.</p>
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
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          {showForm ? 'Close Form' : <><Plus size={16} /> Add Category</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-cyan-700 rounded-2xl p-6 ring-1 ring-cyan-500/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              {editingId ? <Edit2 size={15} className="text-white" /> : <Tag size={15} className="text-white" />}
            </div>
            <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category Name *</label>
              <input
                type="text"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition"
                placeholder="e.g. Snacks, Stationery, Notes"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                rows={2}
                placeholder="Category description..."
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={newCategory.active}
                  onChange={(e) => setNewCategory({ ...newCategory, active: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                Active (visible on store)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-cyan-500/20"
              >
                {editingId ? 'Update Category' : 'Add Category'}
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
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <Tag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No categories yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "Add Category" to create your first category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  category.active 
                    ? 'bg-green-900/50 text-green-400 border border-green-700'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {category.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-cyan-300">{category.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{category.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-medium transition"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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