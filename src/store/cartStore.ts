import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Product = {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  description?: string;
  price_pkr: number;
  discount_percent?: number;
  stock_quantity?: number;
  image_url?: string;
  is_active?: boolean;
};

export type Bundle = {
  id: string;
  name: string;
  description?: string;
  discount_percent?: number;
  products: Product[];
};

interface CartItem {
  type: 'product' | 'bundle';
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  quantity: number;
  category_name?: string;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Product) => void;
  addBundleToCart: (bundle: Bundle) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.type === 'product' && item.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.type === 'product' && item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                type: 'product',
                id: product.id,
                name: product.name,
                price: product.price_pkr,
                discountPercent: product.discount_percent || 0,
                quantity: 1,
                category_name: product.category_name,
              },
            ],
          };
        }),
      addBundleToCart: (bundle) =>
        set((state) => {
          const existing = state.items.find((item) => item.type === 'bundle' && item.id === bundle.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.type === 'bundle' && item.id === bundle.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                type: 'bundle',
                id: bundle.id,
                name: bundle.name,
                price: bundle.products.reduce((sum, p) => sum + p.price_pkr, 0),
                discountPercent: bundle.discount_percent || 0,
                quantity: 1,
              },
            ],
          };
        }),
      removeFromCart: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),
      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
          const discountedPrice = item.price * (1 - (item.discountPercent || 0) / 100);
          return sum + discountedPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'camrigged-cart',
    }
  )
);
