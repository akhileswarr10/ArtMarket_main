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
  totalCount: number
  isInitialized: boolean
  setCart: (cart: CartResponse) => void
  addItemOptimistic: (item: CartItem) => void
  removeItemOptimistic: (artworkId: string) => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  totalCount: 0,
  isInitialized: false,
  setCart: (cart) => set({ items: cart.items, totalCount: cart.items.length, isInitialized: true }),
  addItemOptimistic: (item) => set((state) => ({
    items: [...state.items, item],
    totalCount: state.totalCount + 1
  })),
  removeItemOptimistic: (artworkId) => set((state) => ({
    items: state.items.filter(i => i.artwork_id !== artworkId),
    totalCount: Math.max(0, state.totalCount - 1)
  })),
}))
