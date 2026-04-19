'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { motion } from 'framer-motion'
import {
  Palette, Upload, TrendingUp, Eye, Heart, DollarSign,
  PlusCircle, Package, Settings, LogOut, ChevronRight,
  BarChart3, Star, Bell, Image as ImageIcon, Brush
} from 'lucide-react'

interface Artwork {
  id: string
  title: string
  status: string
  price: number | null
  view_count: number
  images: { signed_url: string | null; is_primary: boolean }[]
  created_at: string
}

export default function ArtistDashboardClient({ session }: { session: any }) {
  const supabase = createClient()
  const router = useRouter()
  const user = session?.user

  const { data: artworksData, isLoading } = useQuery({
    queryKey: ['my-artworks', user?.id],
    queryFn: () => fetchApi('/artworks/mine'),
    enabled: !!session,
  })

  const artworks: Artwork[] = artworksData?.artworks || []
  const published = artworks.filter(a => a.status === 'published')
  const drafts = artworks.filter(a => a.status === 'draft')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const stats = [
    { label: 'Total Artworks', value: artworks.length, icon: Package, color: 'indigo' },
    { label: 'Published', value: published.length, icon: Eye, color: 'emerald' },
    { label: 'Drafts', value: drafts.length, icon: Brush, color: 'amber' },
    { label: 'Total Views', value: artworks.reduce((acc, a) => acc + a.view_count, 0), icon: BarChart3, color: 'violet' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Artist Studio</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your artworks and track performance</p>
          </div>
          <button
            onClick={() => router.push('/artist/upload')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Upload Artwork
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                'bg-violet-500/10 text-violet-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{isLoading ? '—' : value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Artworks Grid */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="font-semibold text-white">Your Artworks</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">{artworks.length} total</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 text-sm mt-4">Loading your artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">No artworks yet</h3>
              <p className="text-slate-500 text-sm mb-6">Start by uploading your first piece</p>
              <button
                onClick={() => router.push('/artist/upload')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload First Artwork
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {artworks.map((artwork) => {
                const primaryImage = artwork.images?.find(i => i.is_primary)
                return (
                  <div key={artwork.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      {primaryImage?.signed_url ? (
                        <img src={primaryImage.signed_url} alt={artwork.title || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{artwork.title || 'Untitled'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{artwork.view_count} views · {new Date(artwork.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        artwork.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                        artwork.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                        artwork.status === 'sold' ? 'bg-slate-500/10 text-slate-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {artwork.status}
                      </span>
                      {artwork.price && (
                        <span className="text-sm font-bold text-white mr-2">£{artwork.price.toLocaleString()}</span>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 border-l border-white/5 pl-3">
                        <button
                          onClick={() => router.push(`/artworks/${artwork.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] font-bold"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          disabled={artwork.status === 'sold'}
                          onClick={() => router.push(`/artist/artworks/${artwork.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Settings className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
