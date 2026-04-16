'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import CartDrawer from './CartDrawer'

export default function CartIcon() {
  const { totalCount, isOpen, setIsOpen } = useCartStore()

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-white transition-colors relative"
      >
        <ShoppingBag className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950">
            {totalCount}
          </span>
        )}
      </button>

      <CartDrawer />
    </>
  )
}
