import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (planId: string) => void;
  updateQuantity: (planId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.planId === item.planId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.planId === item.planId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      removeItem: (planId) =>
        set((state) => ({ items: state.items.filter((i) => i.planId !== planId) })),
      updateQuantity: (planId, quantity) => {
        if (quantity < 1) {
          get().removeItem(planId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.planId === planId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.plan.price * i.quantity, 0),
      count: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    { name: 'sim2me-cart' }
  )
);
