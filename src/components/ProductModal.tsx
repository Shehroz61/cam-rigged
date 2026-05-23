'use client';

import { Product } from '@/store/cartStore';
import { X, ShoppingCart, Check } from 'lucide-react';
import Image from 'next/image';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  inCart: boolean;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart, inCart }: ProductModalProps) {
  if (!isOpen) return null;

  const finalPrice = product.price_pkr * (1 - (product.discount_percent || 0) / 100);
  const categoryName = (product as any).categories?.name || 'Uncategorized';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition z-10"
        >
          <X size={20} />
        </button>

        {product.image_url ? (
          <div className="relative w-full h-64 sm:h-80 bg-gray-800">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover rounded-t-2xl"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-800 rounded-t-2xl flex items-center justify-center">
            <span className="text-gray-500">No image available</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryName !== 'Uncategorized'
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}>
              {categoryName}
            </span>
            {product.discount_percent > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700">
                -{product.discount_percent}%
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white">{product.name}</h2>
          
          <div className="mb-6">
            {product.discount_percent > 0 && (
              <p className="text-sm text-gray-500 line-through">Rs. {product.price_pkr}</p>
            )}
            <p className="text-3xl font-bold text-white">
              Rs. {product.discount_percent > 0 ? finalPrice.toFixed(2) : product.price_pkr}
            </p>
            {product.stock_quantity && product.stock_quantity < 10 && (
              <p className="text-xs text-red-400 mt-2 font-medium">Hurry! Only {product.stock_quantity} left in stock.</p>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {product.description || 'High-quality product for students. Premium materials and fast delivery.'}
            </p>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={inCart}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg ${inCart
                ? 'bg-green-900/50 text-green-400 border border-green-700 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
              }`}
          >
            {inCart ? <Check size={24} /> : <ShoppingCart size={24} />}
            {inCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
