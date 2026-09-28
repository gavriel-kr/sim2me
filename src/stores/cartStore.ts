import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

export interface TravelerInfo {
  email: string;
  firstName: string;
  lastName: string;
}

interface CartState {
  items: CartItem[];
  travelerInfo: TravelerInfo | null;
  setTravelerInfo: (info: TravelerInfo | null) => void;
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
      travelerInfo: null,
      setTravelerInfo: (info) => set({ travelerInfo: info }),
      /* Always one of a plan. The webhook delivers one eSIM per order, so a second click on
         "Add to cart" or "Buy now" used to mean paying twice for one eSIM. Adding the same plan
         again only refreshes it (its price may have changed). */
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.planId === item.planId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.planId === item.planId ? { ...item, quantity: 1 } : i
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
        // Capped at one, for the same reason as addItem.
        set((state) => ({
          items: state.items.map((i) =>
            i.planId === planId ? { ...i, quantity: 1 } : i
          ),
        }));
      },
      clearCart: () => set({ items: [], travelerInfo: null }),
      total: () => get().items.reduce((sum, i) => sum + i.plan.price * i.quantity, 0),
      count: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    {
      name: 'sim2me-cart',
      partialize: (state) => ({ items: state.items }),
      // Version 1: carts saved before the one-per-plan rule may hold a quantity above one.
      version: 1,
      migrate: (persisted) => {
        const saved = persisted as { items?: CartItem[] } | undefined;
        return { items: (saved?.items ?? []).map((i) => ({ ...i, quantity: 1 })) } as Partial<CartState> as CartState;
      },
    }
  )
);
