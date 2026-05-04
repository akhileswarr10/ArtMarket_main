'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, ChevronRight, Calendar, Package, 
  ImageIcon, X, Download, ShieldCheck, Truck, 
  User as UserIcon, Palette
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrderInvoice } from '@/components/OrderInvoice'

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  shipping_address: any
  items: {
    artwork: {
      id: string
      title: string
      medium: string
      dimensions: string
      images: { signed_url: string; is_primary: boolean }[]
    }
  }[]
}

export default function PurchasesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])
  
  const { data, isLoading } = useQuery({
    queryKey: ['my-purchases', session?.user?.id],
    queryFn: () => fetchApi('/orders'),
    enabled: !!session,
  })

  const { data: userData } = useQuery({
    queryKey: ['me', session?.user?.id],
    queryFn: () => fetchApi('/users/me'),
    enabled: !!session,
  })

  const orders: Order[] = data?.orders || []

  const handleDownloadInvoice = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-canvas-950 text-ink p-8 pt-24">
      {/* Hidden Invoice for Printing */}
      <div id="printable-invoice" className="hidden print:block">
        {selectedOrder && <OrderInvoice order={selectedOrder} userData={userData} />}
      </div>

      <div className="max-w-5xl mx-auto print:hidden">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-muted flex items-center justify-center text-emerald">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-ink">My Purchases</h1>
              <p className="text-ink-secondary">Manage and track your art collection</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-surface/60 rounded-[2.5rem] border border-border">
            <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="font-display text-xl font-semibold text-ink mb-2">No purchases yet</h3>
            <p className="text-ink-secondary mb-8">Start your collection by exploring the marketplace</p>
            <button 
              onClick={() => router.push('/artworks')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald text-ink font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const artwork = order.items?.[0]?.artwork
              if (!artwork) return null
              const primaryImage = artwork.images?.find((img: any) => img.is_primary)
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface border border-border-subtle rounded-2xl shadow-card p-4 flex items-center gap-6 group cursor-pointer hover:border-border-strong hover:shadow-card-hover transition-all duration-300"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface shrink-0">
                    {primaryImage?.signed_url ? (
                      <img 
                        src={primaryImage.signed_url} 
                        alt={artwork.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ink truncate text-lg">{artwork.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald rounded-full" />
                        {order.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-mono font-semibold text-ink">${order.total_amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-ink-secondary uppercase tracking-widest font-bold mt-1">Order #{order.id.slice(0, 8)}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-surface/60 group-hover:bg-emerald group-hover:text-ink text-ink-secondary transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-canvas-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface border border-border w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface/30">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">Order Details</h2>
                  <p className="text-xs text-ink-secondary mt-1 uppercase tracking-widest font-bold">Transaction #{selectedOrder.id.slice(0, 12)}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-surface-raised/70 rounded-xl text-ink-secondary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Artwork & Stats */}
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-surface-raised shrink-0 border border-border">
                    {selectedOrder.items?.[0]?.artwork?.images?.find((img: any) => img.is_primary)?.signed_url ? (
                      <img src={selectedOrder.items?.[0]?.artwork?.images?.find((img: any) => img.is_primary)?.signed_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-ink mb-2">{selectedOrder.items?.[0]?.artwork?.title}</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center gap-2 text-xs text-ink-secondary">
                         <Palette className="w-3.5 h-3.5 text-gold-400" />
                         {selectedOrder.items?.[0]?.artwork?.medium}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-ink-secondary">
                         <Calendar className="w-3.5 h-3.5 text-gold-400" />
                         {new Date(selectedOrder.created_at).toLocaleDateString()}
                       </div>
                    </div>
                    <div className="badge-emerald mt-4">
                       <ShieldCheck className="w-3 h-3" />
                       Verified Purchase
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Shipping Status</h4>
                    <div className="bg-surface/60 rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                         <Truck className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-ink capitalize">{selectedOrder.status}</p>
                         <p className="text-[10px] text-ink-secondary">Awaiting dispatch from artist</p>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Acquired By</h4>
                    <div className="bg-surface/60 rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gold-muted flex items-center justify-center text-gold-400">
                         <UserIcon className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-ink">{userData?.display_name || 'Collector'}</p>
                         <p className="text-[10px] text-ink-secondary truncate w-32">{userData?.email}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-surface/60 rounded-[2rem] p-6 border border-border-subtle space-y-3">
                   <div className="flex justify-between text-sm text-ink-secondary">
                     <span>Artwork Price</span>
                     <span className="text-ink">${selectedOrder.total_amount?.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm text-ink-secondary">
                     <span>Standard Shipping</span>
                     <span className="text-emerald font-bold uppercase text-[10px]">Free</span>
                   </div>
                   <div className="pt-3 border-t border-border flex justify-between items-baseline">
                     <span className="font-bold text-ink">Total Paid</span>
                     <span className="font-mono text-3xl font-semibold text-emerald">${selectedOrder.total_amount?.toLocaleString()}</span>
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-surface/30 border-t border-border-subtle flex gap-3">
                <button 
                  onClick={handleDownloadInvoice}
                  className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-all shadow-xl shadow-black/20"
                >
                  <Download className="w-4 h-4" />
                  Print / View Bill
                </button>
                <button 
                  onClick={() => router.push(`/artworks/${selectedOrder.items?.[0]?.artwork?.id}`)}
                  className="px-6 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-2xl transition-all"
                >
                  View Artwork
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
