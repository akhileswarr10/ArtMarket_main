'use client'

import React from 'react'
import { Palette, ShieldCheck, Mail, Globe } from 'lucide-react'

interface OrderInvoiceProps {
  order: any
  userData: any
}

export const OrderInvoice = React.forwardRef<HTMLDivElement, OrderInvoiceProps>(({ order, userData }, ref) => {
  if (!order) return null

  return (
    <div ref={ref} className="bg-canvas-50 p-12 text-ink border border-border" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-ink">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter">ArtMarket</h1>
            <p className="text-xs text-ink-secondary font-bold uppercase tracking-widest">Masterpiece Acquisition</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-display text-5xl font-bold text-slate-200 uppercase tracking-tighter">Receipt</h2>
          <p className="text-sm font-bold text-ink-secondary mt-2">#ORD-{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold uppercase text-ink-secondary tracking-widest mb-4">Issued To</h3>
          <p className="font-bold text-lg">{userData?.display_name || 'Valued Collector'}</p>
          <p className="text-ink-secondary text-sm mt-1">{userData?.email}</p>
          {order.shipping_address && (
            <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
              {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}, {order.shipping_address.country}
            </p>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold uppercase text-ink-secondary tracking-widest mb-4">Entity Information</h3>
          <p className="font-bold">ArtMarket Global Ltd.</p>
          <p className="text-ink-secondary text-sm mt-1">127 Digital Plaza, Arts District</p>
          <p className="text-ink-secondary text-sm">support@artmarket.ai</p>
          <div className="flex items-center justify-end gap-2 mt-4 text-emerald-600 font-bold text-xs">
            <ShieldCheck className="w-3 h-3" />
            SECURE TRANSACTION
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="px-6 py-4 bg-canvas-50 rounded-xl flex justify-between items-center mb-12">
        <span className="text-xs font-bold uppercase text-ink-secondary tracking-widest">Transaction Date</span>
        <span className="font-bold">{new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
      </div>

      {/* Item Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-4 text-xs font-bold uppercase text-ink-secondary tracking-widest">Item Description</th>
            <th className="py-4 text-xs font-bold uppercase text-ink-secondary tracking-widest text-right">Qty</th>
            <th className="py-4 text-xs font-bold uppercase text-ink-secondary tracking-widest text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border-subtle">
              <td className="py-6">
                <p className="font-bold text-lg text-ink">{item.title_snapshot || 'Original Artwork'}</p>
              </td>
              <td className="py-6 font-bold text-right text-ink">1</td>
              <td className="py-6 font-bold text-right text-ink">${(item.price_paid || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-24">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-secondary">Subtotal</span>
            <span className="font-bold text-ink">${(order.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-secondary">Shipping</span>
            <span className="font-bold text-emerald-600">FREE</span>
          </div>
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-widest">Total Amount</span>
            <span className="font-display text-4xl font-bold text-ink">${(order.total_amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-border-subtle pt-8 text-center">
        <p className="text-xs text-ink-secondary italic max-w-sm mx-auto leading-relaxed">
          This document serves as an official proof of acquisition for original artwork on ArtMarket. 
          Ownership has been verified and recorded on the platform.
        </p>
        <div className="flex items-center justify-center gap-6 mt-8">
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-secondary">
             <Globe className="w-3 h-3" />
             artmarket.ai
           </div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-secondary">
             <Mail className="w-3 h-3" />
             help@artmarket.ai
           </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
})

OrderInvoice.displayName = 'OrderInvoice'
