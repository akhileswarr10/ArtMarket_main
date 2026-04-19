'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { removeFromCart } from '@/lib/api/client'

export default function CartDrawer() {
  const router = useRouter()
  const { items, totalCount, removeItemOptimistic, isOpen, setIsOpen } = useCartStore()

  const onClose = () => setIsOpen(false)

  const handleRemove = async (artworkId: string) => {
    // Optimistic
    removeItemOptimistic(artworkId)
    try {
        await removeFromCart(artworkId)
    } catch (e) {
        // Rollback skipped for simplicity
    }
  }

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/checkout')
  }

  const total = items.reduce((acc, item) => acc + (item.artwork.price || 0), 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl z-[70] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                Your Cart
                <span className="text-xs bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full">
                  {totalCount} item{totalCount !== 1 ? 's' : ''}
                </span>
              </h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {items.some(i => i.artwork.status === 'sold') && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 text-xs text-rose-400 font-medium flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                Some items are no longer available and must be removed.
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-400 mb-2">Your cart is empty</p>
                  <p className="text-sm">Explore the marketplace to find new pieces.</p>
                  <button 
                    onClick={() => { onClose(); router.push('/') }}
                    className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-bold transition-colors"
                  >
                    Start Browsing
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const isSold = item.artwork.status === 'sold'
                  return (
                    <div key={item.id} className={`flex gap-4 group transition-opacity ${isSold ? 'opacity-50' : ''}`}>
                      <div className={`w-24 h-24 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative ${isSold ? 'grayscale' : ''}`}>
                        {item.artwork.primary_image_url ? (
                          <img 
                            src={item.artwork.primary_image_url} 
                            alt={item.artwork.title || 'Artwork'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                        )}
                        {isSold && (
                          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white px-2 py-1 bg-rose-600 rounded-md uppercase tracking-wider">Sold</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className={`font-bold text-sm line-clamp-1 ${isSold ? 'text-slate-500' : 'text-white'}`}>{item.artwork.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">{isSold ? 'No longer available' : 'Authentic Original'}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-black ${isSold ? 'text-slate-600' : 'text-indigo-400'}`}>
                            ${item.artwork.price?.toLocaleString()}
                          </span>
                          <button 
                            onClick={() => handleRemove(item.artwork_id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-slate-900/50">
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-white">${total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
