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
  amount: number
  status: string
  created_at: string
  shipping_details: any
  artwork: {
    id: string
    title: string
    medium: string
    dimensions: string
    images: { signed_url: string; is_primary: boolean }[]
  }
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
    queryFn: () => fetchApi('/orders/mine'),
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
    <div className="min-h-screen bg-slate-950 text-white p-8 pt-24">
      {/* Hidden Invoice for Printing */}
      <div id="printable-invoice" className="hidden print:block">
        {selectedOrder && <OrderInvoice order={selectedOrder} userData={userData} />}
      </div>

      <div className="max-w-5xl mx-auto print:hidden">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">My Purchases</h1>
              <p className="text-slate-400">Manage and track your art collection</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/10">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No purchases yet</h3>
            <p className="text-slate-500 mb-8">Start your collection by exploring the marketplace</p>
            <button 
              onClick={() => router.push('/artworks')}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const primaryImage = order.artwork.images?.find(img => img.is_primary)
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-6 group hover:border-emerald-500/30 hover:bg-white/8 transition-all cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    {primaryImage?.signed_url ? (
                      <img 
                        src={primaryImage.signed_url} 
                        alt={order.artwork.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate text-lg">{order.artwork.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {order.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-white">${order.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Order #{order.id.slice(0, 8)}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 transition-all">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div>
                  <h2 className="text-xl font-bold text-white">Order Details</h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Transaction #{selectedOrder.id.slice(0, 12)}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Artwork & Stats */}
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                    {selectedOrder.artwork.images?.find(img => img.is_primary)?.signed_url ? (
                      <img src={selectedOrder.artwork.images?.find(img => img.is_primary)?.signed_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2">{selectedOrder.artwork.title}</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Palette className="w-3.5 h-3.5 text-indigo-400" />
                         {selectedOrder.artwork.medium}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                         {new Date(selectedOrder.created_at).toLocaleDateString()}
                       </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                       <ShieldCheck className="w-3 h-3" />
                       Verified Purchase
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Shipping Status</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                         <Truck className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white capitalize">{selectedOrder.status}</p>
                         <p className="text-[10px] text-slate-500">Awaiting dispatch from artist</p>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Acquired By</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                         <UserIcon className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white">{userData?.display_name || 'Collector'}</p>
                         <p className="text-[10px] text-slate-500 truncate w-32">{userData?.email}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 space-y-3">
                   <div className="flex justify-between text-sm text-slate-400">
                     <span>Artwork Price</span>
                     <span className="text-white">${selectedOrder.amount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm text-slate-400">
                     <span>Standard Shipping</span>
                     <span className="text-emerald-400 font-bold uppercase text-[10px]">Free</span>
                   </div>
                   <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                     <span className="font-bold text-white">Total Paid</span>
                     <span className="text-3xl font-black text-emerald-500">${selectedOrder.amount.toLocaleString()}</span>
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/2 border-t border-white/5 flex gap-3">
                <button 
                  onClick={handleDownloadInvoice}
                  className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                >
                  <Download className="w-4 h-4" />
                  Download Bill
                </button>
                <button 
                  onClick={() => router.push(`/artworks/${selectedOrder.artwork.id}`)}
                  className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
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
