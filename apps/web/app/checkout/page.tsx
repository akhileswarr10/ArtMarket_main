'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, Truck, ShieldCheck, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { createCheckoutSession, confirmCheckout, removeFromCart } from '@/lib/api/client'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalCount } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  })

  // If cart is empty, redirect back
  if (totalCount === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
        <button 
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
        >
          Go Back
        </button>
      </div>
    )
  }

  const total = items.reduce((acc, item) => acc + (item.artwork.price || 0), 0)
  const soldItems = items.filter(item => item.artwork.status === 'sold')
  const hasSoldItems = soldItems.length > 0

  const handleRemoveSold = async (artworkId: string) => {
    useCartStore.getState().removeItemOptimistic(artworkId)
    try {
      await removeFromCart(artworkId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasSoldItems) {
        setError('Please remove unavailable items from your cart to proceed.')
        return
    }
    setLoading(true)
    setError('')
    
    try {
      // 1. Create checkout session
      const checkoutRes = await createCheckoutSession({
        line1: formData.line1,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country
      })

      // 2. Dummy payment confirmation
      await confirmCheckout(checkoutRes.order_id)
      
      // 3. Clear cart locally
      useCartStore.getState().clearCart()

      // 4. Success
      router.push(`/checkout/success?order_id=${checkoutRes.order_id}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-black text-white mb-2">Checkout</h1>
            <p className="text-slate-400">Complete your acquisition securely</p>
          </header>

          {hasSoldItems && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex gap-3 items-center">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Items Unavailable</p>
                <p className="text-xs opacity-80">Some artworks in your cart have already been sold. Please remove them to complete your acquisition.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Truck className="w-5 h-5 text-indigo-400" />
                Shipping Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Street Address</label>
                  <input required value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="123 Art St" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">City</label>
                  <input required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">State / Province</label>
                  <input required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="NY" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">ZIP / Postal Code</label>
                  <input required value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="10001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Country</label>
                  <input required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="USA" />
                </div>
              </div>
            </section>

            <button 
              type="submit"
              disabled={loading || hasSoldItems}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : hasSoldItems ? (
                <><AlertTriangle className="w-5 h-5" /> Remove sold items to pay</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Pay Now (Dummy)</>
              )}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden p-6 space-y-6">
            <h2 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-4">Order Summary</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {items.map(item => {
                const isSold = item.artwork.status === 'sold'
                return (
                  <div key={item.id} className={`space-y-2 border-b border-white/5 pb-4 last:border-0 ${isSold ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-slate-300 line-clamp-1 pr-4">{item.artwork.title}</span>
                      <span className="text-white font-medium shrink-0">
                        ${(item.artwork.price||0).toLocaleString()}
                      </span>
                    </div>
                    {isSold ? (
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded">Sold Out</span>
                         <button 
                          onClick={() => handleRemoveSold(item.artwork_id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                         >
                           <Trash2 className="w-3 h-3" />
                           Remove
                         </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">Available</div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
                <span className="font-bold text-white">Total</span>
                <span className="text-2xl font-black text-indigo-500">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
