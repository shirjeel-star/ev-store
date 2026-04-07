import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/lib/api';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],           // { id, variantId, productId, name, image, price, quantity, sku, stock, variant }
      discount: null,      // { code, type, value, discountAmount }
      loading: false,
      synced: false,       // whether we've pulled from server

      // Totals derived from items
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
      get discountAmount() {
        return get().discount?.discountAmount || 0;
      },
      get total() {
        return Math.max(0, get().subtotal - get().discountAmount);
      },

      // Fetch server cart (after login)
      fetchCart: async () => {
        try {
          const { data } = await cartApi.get();
          const items = data.items.map((i) => ({
            id: i.id,
            variantId: i.variantId,
            productId: i.variant.product.id,
            name: i.variant.product.name,
            image: i.variant.product.images?.[0]?.url || '/placeholder.jpg',
            price: parseFloat(i.variant.price),
            quantity: i.quantity,
            sku: i.variant.sku,
            stock: i.variant.stock,
            variant: i.variant.name,
          }));
          set({ items, synced: true });
        } catch {
          // Guest — keep local state
          set({ synced: true });
        }
      },

      addItem: async (variantId, quantity = 1) => {
        set({ loading: true });
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          if (token) {
            const { data } = await cartApi.add({ variantId, quantity });
            const items = data.items.map((i) => ({
              id: i.id,
              variantId: i.variantId,
              productId: i.variant.product.id,
              name: i.variant.product.name,
              image: i.variant.product.images?.[0]?.url || '/placeholder.jpg',
              price: parseFloat(i.variant.price),
              quantity: i.quantity,
              sku: i.variant.sku,
              stock: i.variant.stock,
              variant: i.variant.name,
            }));
            set({ items });
          } else {
            // Guest cart — optimistic local update
            const current = get().items;
            const existing = current.find((i) => i.variantId === variantId);
            if (existing) {
              set({ items: current.map((i) => i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i) });
            } else {
              set({ items: [...current, { variantId, quantity, id: `local-${Date.now()}` }] });
            }
          }
        } finally {
          set({ loading: false });
        }
      },

      updateItem: async (itemId, quantity) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          const { data } = await cartApi.update(itemId, quantity);
          const items = data.items.map((i) => ({
            id: i.id,
            variantId: i.variantId,
            productId: i.variant.product.id,
            name: i.variant.product.name,
            image: i.variant.product.images?.[0]?.url || '/placeholder.jpg',
            price: parseFloat(i.variant.price),
            quantity: i.quantity,
            sku: i.variant.sku,
            stock: i.variant.stock,
            variant: i.variant.name,
          }));
          set({ items });
        } else {
          set({ items: get().items.map((i) => i.id === itemId ? { ...i, quantity } : i) });
        }
      },

      removeItem: async (itemId) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          await cartApi.remove(itemId);
        }
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      clearCart: () => set({ items: [], discount: null }),

      applyDiscount: async (code) => {
        const { data } = await cartApi.applyDiscount(code);
        set({
          discount: {
            code,
            type: data.discountType,
            value: data.discountValue,
            discountAmount: data.discountAmount,
          },
        });
        return data;
      },

      removeDiscount: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) await cartApi.removeDiscount();
        set({ discount: null });
      },
    }),
    {
      name: 'volt-cart',
      partialize: (state) => ({ items: state.items, discount: state.discount }),
    }
  )
);

export default useCartStore;
export { useCartStore };
