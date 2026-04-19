import { create } from 'zustand'

export interface ArtworkSnap {
    id: string;
    title: string | null;
    price: number | null;
    status: string;
    artist_id: string;
    primary_image_url: string | null;
}

export interface CartItem {
  id: string
  cart_id: string
  artwork_id: string
  price_at_add: number
  added_at: string
  artwork: ArtworkSnap
}

export interface CartResponse {
  id: string
  buyer_id: string
  items: CartItem[]
  total: number
  created_at: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  totalCount: number
  isInitialized: boolean
  setCart: (cart: CartResponse) => void
  addItemOptimistic: (item: CartItem) => void
  removeItemOptimistic: (artworkId: string) => void
  setIsOpen: (isOpen: boolean) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  isOpen: false,
  totalCount: 0,
  isInitialized: false,
  setCart: (cart) => set({ items: cart.items, totalCount: cart.items.length, isInitialized: true }),
  addItemOptimistic: (item) => set((state) => ({
    items: [...state.items, item],
    totalCount: state.totalCount + 1,
    isOpen: true // Automatically open cart when adding
  })),
  removeItemOptimistic: (artworkId) => set((state) => ({
    items: state.items.filter(i => i.artwork_id !== artworkId),
    totalCount: Math.max(0, state.totalCount - 1)
  })),
  setIsOpen: (isOpen) => set({ isOpen }),
  clearCart: () => set({ items: [], totalCount: 0, isInitialized: true }),
}))
