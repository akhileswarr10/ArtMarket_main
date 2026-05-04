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
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Your cart is empty</h1>
        <button 
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-3 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-xl transition-all"
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
    <div className="min-h-screen bg-canvas-950 pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-8">
          <header>
            <h1 className="font-display text-5xl font-bold text-ink mb-2">Checkout</h1>
            <p className="text-ink-secondary">Complete your acquisition securely</p>
          </header>

          {hasSoldItems && (
            <div className="p-4 bg-rose-muted border border-rose/20 rounded-xl text-rose text-sm flex gap-3 items-center">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Items Unavailable</p>
                <p className="text-xs opacity-80">Some artworks in your cart have already been sold. Please remove them to complete your acquisition.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-muted border border-rose/20 rounded-xl text-rose text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface border border-border-subtle rounded-3xl shadow-card p-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-6 flex items-center gap-3">
                <Truck className="w-5 h-5 text-gold-400" />
                Shipping Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">Street Address</label>
                  <input required value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} type="text" className="input-galerie w-full" placeholder="123 Art St" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">City</label>
                  <input required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} type="text" className="input-galerie w-full" placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">State / Province</label>
                  <input required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} type="text" className="input-galerie w-full" placeholder="NY" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">ZIP / Postal Code</label>
                  <input required value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} type="text" className="input-galerie w-full" placeholder="10001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">Country</label>
                  <input required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} type="text" className="input-galerie w-full" placeholder="USA" />
                </div>
              </div>
            </section>

            <button 
              type="submit"
              disabled={loading || hasSoldItems}
              className="btn-gold w-full disabled:opacity-50"
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
          <div className="bg-surface border border-border-subtle rounded-3xl shadow-card overflow-hidden p-6 space-y-6">
            <h2 className="font-bold text-ink uppercase tracking-widest text-xs border-b border-border pb-4">Order Summary</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {items.map(item => {
                const isSold = item.artwork.status === 'sold'
                return (
                  <div key={item.id} className={`space-y-2 border-b border-border-subtle pb-4 last:border-0 ${isSold ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start text-sm">
                      <span className="text-ink-muted line-clamp-1 pr-4">{item.artwork.title}</span>
                      <span className="text-ink font-medium shrink-0">
                        ${(item.artwork.price||0).toLocaleString()}
                      </span>
                    </div>
                    {isSold ? (
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-rose uppercase tracking-widest bg-rose-muted px-2 py-0.5 rounded">Sold Out</span>
                         <button 
                          onClick={() => handleRemoveSold(item.artwork_id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-ink-secondary hover:text-ink transition-colors"
                         >
                           <Trash2 className="w-3 h-3" />
                           Remove
                         </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-ink-secondary uppercase tracking-widest">Available</div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 pt-6 border-t border-border-subtle text-sm">
              <div className="flex justify-between text-ink-secondary">
                <span>Subtotal</span>
                <span className="text-ink">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Shipping</span>
                <span className="text-emerald font-bold uppercase text-[10px] bg-emerald-muted px-2 py-0.5 rounded">Free</span>
              </div>
              <div className="pt-3 border-t border-border-subtle flex justify-between items-baseline">
                <span className="font-bold text-ink">Total</span>
                <span className="text-2xl font-mono font-semibold text-gold-500">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
