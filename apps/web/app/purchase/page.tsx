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
      await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          artwork_id: artwork.id,
          amount: artwork.price,
          shipping_details: {
            // Simplified for now
            status: 'paid'
          }
        }),
      })
      setStep('success')
    } catch (err) {
      console.error('Purchase failed:', err)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  if (!artworkId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">No Artwork Selected</h1>
        <p className="text-slate-400 mb-6">Please select an artwork from the marketplace to purchase.</p>
        <button 
          onClick={() => router.push('/buyer/dashboard')}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
        >
          Go to Marketplace
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Artwork</h1>
        <p className="text-slate-400 mb-6 font-medium">We couldn't find the artwork you're looking for.</p>
        <button 
          onClick={() => router.push('/buyer/dashboard')}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
        >
          Back to Discover
        </button>
      </div>
    )
  }

  const primaryImage = artwork.images?.find((i: any) => i.is_primary)

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 px-6 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h1 className="text-4xl font-black text-white mb-4">Congratultions!</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-lg">
          You are now the proud owner of <span className="text-white font-bold">"{artwork.title}"</span>. 
          The artist has been notified and will prepare your piece for shipping.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/buyer/dashboard')}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => window.print()}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
          >
            Print Receipt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-10 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Checkout Details */}
          <div className="space-y-8">
            <header>
              <h1 className="text-4xl font-black text-white mb-2">Checkout</h1>
              <p className="text-slate-400">Complete your purchase for this unique masterpiece</p>
            </header>

            {/* Shipping Info */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Truck className="w-5 h-5 text-indigo-400" />
                Shipping Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Phone</label>
                  <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Shipping Address</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50 resize-none" placeholder="123 Art Street, Gallery District, NY 10001" />
                </div>
              </div>
            </section>

            {/* Payment Info */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-slate-800 rounded-md border border-white/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Credit Card</p>
                      <p className="text-xs text-indigo-400">Secure transaction powered by Stripe</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Your payment information is encrypted and never stored on our servers.
                </p>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="font-bold text-white uppercase tracking-widest text-xs">Order Summary</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    {primaryImage?.signed_url ? (
                      <img src={primaryImage.signed_url} alt={artwork.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{artwork.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Authentic original artwork</p>
                    <p className="text-sm font-black text-indigo-400 mt-2">${artwork.price?.toLocaleString() || '0'}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white">${artwork.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Insurance</span>
                    <span className="text-white">$0.00</span>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
                    <span className="font-bold text-white">Total</span>
                    <span className="text-2xl font-black text-indigo-500">${artwork.price?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:bg-indigo-800"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
      <PurchaseContent />
    </Suspense>
  )
}
