'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, FileText } from 'lucide-react'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }
    
    // In a real app we might poll for status=paid if Stripe webhook was used.
    // For this dummy flow, we did sync dummy processing, so just set loading false.
    const timer = setTimeout(() => {
        setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6 text-center text-ink">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
        <p className="animate-pulse">Finalizing your order...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas-950 pt-20 px-6 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-emerald-muted flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald" />
      </motion.div>
      <h1 className="font-display text-5xl font-bold text-ink mb-4">Payment Successful!</h1>
      <p className="text-ink-secondary max-w-md mx-auto mb-10 text-lg">
        Thank you for your acquisition. The artists have been notified and will prepare your pieces for shipping.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => router.push('/buyer/dashboard')}
          className="px-8 py-4 bg-gold-500 hover:bg-gold-500 text-ink font-bold rounded-2xl transition-all shadow-xl shadow-gold-sm"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => router.push(`/orders/${orderId}`)}
          className="px-8 py-4 bg-surface/60 hover:bg-surface-raised/70 text-ink font-bold rounded-2xl transition-all flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Receipt
        </button>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-gold-500 animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
