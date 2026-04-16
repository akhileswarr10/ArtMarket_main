'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Package, Search } from 'lucide-react'
import { fetchApi } from '@/lib/api/client'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/orders').then((data) => {
      setOrders(data.orders || [])
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24 px-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-white">Your Acquisitions</h1>
          <p className="text-slate-400 mt-2">Track the status of your artwork purchases.</p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                No orders found.
            </div>
          ) : (
            orders.map((order, i) => (
              <div 
                key={order.id} 
                onClick={() => router.push(`/orders/${order.id}`)}
                className={`p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${i !== orders.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                    order.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                    order.status === 'cancelled' || order.status === 'refunded' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {order.status}
                  </span>
                  <p className="font-black text-indigo-400 mt-2">${(order.total_amount || 0).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
