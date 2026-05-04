'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, CreditCard, ShieldCheck, Truck, 
  ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Image as ImageIcon
} from 'lucide-react'

function PurchaseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const artworkId = searchParams.get('artworkId')
  const [step, setStep] = useState<'checkout' | 'success'>('checkout')
  const [loading, setLoading] = useState(false)

  const { data: artwork, isLoading, error } = useQuery({
    queryKey: ['artwork', artworkId],
    queryFn: () => fetchApi(`/artworks/${artworkId}`),
    enabled: !!artworkId,
  })

  const handlePurchase = async () => {
    if (!artwork) return
    setLoading(true)
    try {
      const res = await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          artwork_id: artwork.id,
        }),
      })
      router.push('/checkout')
    } catch (err: any) {
      if (err.message?.includes('already in cart')) {
        router.push('/checkout')
      } else {
        console.error('Add to cart failed:', err)
        alert('Failed to add to cart. ' + (err.message || 'Please try again.'))
        setLoading(false)
      }
    }
  }


  if (!artworkId) {
    return (
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose mb-4" />
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">No Artwork Selected</h1>
        <p className="text-ink-secondary mb-6">Please select an artwork from the marketplace to purchase.</p>
        <button 
          onClick={() => router.push('/buyer/dashboard')}
          className="px-6 py-3 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-xl transition-all"
        >
          Go to Marketplace
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-gold-500 animate-spin" />
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose mb-4" />
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Error Loading Artwork</h1>
        <p className="text-ink-secondary mb-6 font-medium">We couldn't find the artwork you're looking for.</p>
        <button 
          onClick={() => router.push('/buyer/dashboard')}
          className="px-6 py-3 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-xl transition-all"
        >
          Back to Discover
        </button>
      </div>
    )
  }

  const primaryImage = artwork.images?.find((i: any) => i.is_primary)

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-canvas-950 pt-20 px-6 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-emerald-muted flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald" />
        </motion.div>
        <h1 className="font-display text-5xl font-bold text-ink mb-4">Congratultions!</h1>
        <p className="text-ink-secondary max-w-md mx-auto mb-10 text-lg">
          You are now the proud owner of <span className="text-ink font-bold">"{artwork.title}"</span>. 
          The artist has been notified and will prepare your piece for shipping.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/buyer/dashboard')}
            className="px-8 py-4 bg-gold-500 hover:bg-gold-500 text-ink font-bold rounded-2xl transition-all shadow-xl shadow-gold-sm"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => window.print()}
            className="px-8 py-4 bg-surface/60 hover:bg-surface-raised/70 text-ink font-bold rounded-2xl transition-all"
          >
            Print Receipt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas-950 pt-10 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-secondary hover:text-ink transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Checkout Details */}
          <div className="space-y-8">
            <header>
              <h1 className="font-display text-5xl font-bold text-ink mb-2">Checkout</h1>
              <p className="text-ink-secondary">Complete your purchase for this unique masterpiece</p>
            </header>

            {/* Shipping Info */}
            <section className="bg-surface border border-border-subtle rounded-3xl shadow-card p-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-6 flex items-center gap-3">
                <Truck className="w-5 h-5 text-gold-400" />
                Shipping Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">Full Name</label>
                  <input type="text" className="input-galerie w-full" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">Phone</label>
                  <input type="text" className="input-galerie w-full" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-ink-secondary">Shipping Address</label>
                  <textarea rows={3} className="input-galerie w-full resize-none" placeholder="123 Art Street, Gallery District, NY 10001" />
                </div>
              </div>
            </section>

            {/* Payment Info */}
            <section className="bg-surface border border-border-subtle rounded-3xl shadow-card p-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-6 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gold-400" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gold-muted border-2 border-gold/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-surface-raised rounded-md border border-border flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-ink-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Credit Card</p>
                      <p className="text-xs text-gold-400">Secure transaction powered by Stripe</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gold-500" />
                </div>
                <p className="text-xs text-ink-secondary text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Your payment information is encrypted and never stored on our servers.
                </p>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="bg-surface border border-border-subtle rounded-3xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-bold text-ink uppercase tracking-widest text-xs">Order Summary</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-raised shrink-0">
                    {primaryImage?.signed_url ? (
                      <img src={primaryImage.signed_url} alt={artwork.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">{artwork.title}</h3>
                    <p className="text-xs text-ink-secondary mt-1">Authentic original artwork</p>
                    <p className="text-sm font-mono font-semibold text-gold-400 mt-2">£{artwork.price?.toLocaleString() || '0'}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-border-subtle text-sm">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Subtotal</span>
                    <span className="text-ink">£{artwork.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>Shipping</span>
                    <span className="text-emerald font-bold uppercase text-[10px] bg-emerald-muted px-2 py-0.5 rounded">Free</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>Insurance</span>
                    <span className="text-ink">£0.00</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle flex justify-between items-baseline">
                    <span className="font-bold text-ink">Total</span>
                    <span className="text-2xl font-mono font-semibold text-gold-500">£{artwork.price?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="btn-gold w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Complete Acquisition
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas-950 flex items-center justify-center"><Loader2 className="w-7 h-7 text-gold-500 animate-spin" /></div>}>
      <PurchaseContent />
    </Suspense>
  )
}
