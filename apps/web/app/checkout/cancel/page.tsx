'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-16 h-16 text-rose mb-4" />
      <h1 className="text-3xl font-bold text-ink mb-2">Checkout Cancelled</h1>
      <p className="text-ink-secondary mb-8 max-w-md">
        Your payment process was cancelled. Your cart has been saved and you can 
        complete your acquisition whenever you're ready.
      </p>
      <button 
        onClick={() => router.push('/')}
        className="px-8 py-3 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-xl transition-all font-bold"
      >
        Return to Marketplace
      </button>
    </div>
  )
}
