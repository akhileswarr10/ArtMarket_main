'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchApi } from '@/lib/api/client'
import { Loader2, ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { OrderInvoice } from '@/components/OrderInvoice'
import { useReactToPrint } from 'react-to-print'

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        const data = await fetchApi(`/orders/${id}`)
        setOrder(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-canvas-950 flex items-center justify-center"><Loader2 className="w-7 h-7 text-gold-500 animate-spin" /></div>
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-4">Order Not Found</h1>
        <button onClick={() => router.push('/orders')} className="text-gold-400 hover:underline">Back to Orders</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas-950 pt-24 px-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-ink-secondary hover:text-ink transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <button 
            onClick={handlePrint}
            className="btn-gold"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-surface/60">
          {/* Hide invoice visually on mobile or use overflow, but we scale it nicely or show raw data. 
              The invoice looks best on large screens or print. */}
          <div className="p-4 md:p-12 overflow-x-auto print-container flex justify-center">
             <OrderInvoice ref={componentRef} order={order} userData={{ email: user?.email, display_name: user?.user_metadata?.display_name }} />
          </div>
        </div>
      </div>
    </div>
  )
}
