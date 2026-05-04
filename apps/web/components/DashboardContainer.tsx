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
  BarChart3, Star, Bell, Image as ImageIcon, Brush, Send, Loader2
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

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchApi('/users/me'),
    enabled: !!session,
  })

  const { data: artworksData, isLoading } = useQuery({
    queryKey: ['my-artworks', user?.id],
    queryFn: () => fetchApi('/artworks/mine'),
    enabled: !!session,
  })

  const artworks: Artwork[] = artworksData?.artworks || []
  const published = artworks.filter(a => a.status === 'published')
  const drafts = artworks.filter(a => a.status === 'draft')
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handlePublish = async (id: string) => {
    setPublishingId(id)
    try {
      await fetchApi(`/artworks/${id}/publish`, { method: 'PATCH' })
      router.refresh()
      // Note: React Query will refetch 'my-artworks' automatically if configured or we can invalidate it
    } catch (err) {
      console.error('Publishing failed:', err)
      alert('Failed to publish. Ensure the artwork has a title, price and image.')
    } finally {
      setPublishingId(null)
    }
  }

  const stats = [
    { label: 'Total Artworks', value: artworks.length, icon: Package, color: 'indigo' },
    { label: 'Published', value: published.length, icon: Eye, color: 'emerald' },
    { label: 'Drafts', value: drafts.length, icon: Brush, color: 'amber' },
    { label: 'Total Views', value: artworks.reduce((acc, a) => acc + a.view_count, 0), icon: BarChart3, color: 'violet' },
  ]

  return (
    <div className="min-h-screen bg-canvas-950 text-ink">
      <main className="max-w-7xl mx-auto p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Artist Studio</h1>
            <p className="text-ink-secondary text-sm mt-1">Manage your artworks and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/artist/sales')}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface/60 hover:bg-surface-raised/70 text-ink font-semibold rounded-xl transition-all border border-border"
            >
              <TrendingUp className="w-4 h-4 text-emerald" />
              View Sales
            </button>
            <button
              onClick={() => router.push('/artist/upload')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-500 text-ink font-semibold rounded-xl transition-all shadow-lg shadow-gold-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Upload Artwork
            </button>
          </div>
        </div>

        {/* Verification Banner */}
        {userData?.artist_profile && userData.artist_profile.verification_status !== 'verified' && (
          <div className="mb-8 p-6 bg-gold-900/40 border border-gold/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gold/[0.18] rounded-xl flex items-center justify-center">
                 <Star className="w-6 h-6 text-gold-400" />
               </div>
               <div>
                 <h3 className="text-ink font-bold text-lg">
                   {userData.artist_profile.verification_status === 'pending' ? 'Verification Pending' : 'Become a Verified Artist'}
                 </h3>
                 <p className="text-ink-secondary text-sm mt-1">
                   {userData.artist_profile.verification_status === 'pending' 
                     ? 'Your application is currently under review by our curation team.'
                     : 'Earn a verified badge to show collectors your work is authentic and gain more visibility.'}
                 </p>
               </div>
            </div>
            {userData.artist_profile.verification_status !== 'pending' && (
              <button
                onClick={() => router.push('/artist/verification')}
                className="px-5 py-2.5 bg-gold-500 hover:bg-gold-500 text-ink font-semibold rounded-xl transition-all shadow-lg shadow-gold-sm text-sm shrink-0"
              >
                Apply for Verification
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border-subtle rounded-2xl shadow-card p-5 hover:border-border-strong hover:shadow-card-hover transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                color === 'indigo' ? 'bg-gold-muted text-gold-400' :
                color === 'emerald' ? 'bg-emerald-muted text-emerald' :
                color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                'bg-copper/10 text-copper'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-semibold text-ink">{isLoading ? '—' : value}</p>
              <p className="text-xs text-ink-secondary mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Artworks Grid */}
        <div className="bg-surface border border-border-subtle rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-ink">Your Artworks</h2>
            <span className="text-xs text-ink-secondary bg-surface/60 px-2 py-1 rounded-lg">{artworks.length} total</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold-500 rounded-full animate-spin mx-auto" />
              <p className="text-ink-secondary text-sm mt-4">Loading your artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gold-400" />
              </div>
              <h3 className="text-ink font-semibold mb-2">No artworks yet</h3>
              <p className="text-ink-secondary text-sm mb-6">Start by uploading your first piece</p>
              <button
                onClick={() => router.push('/artist/upload')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-500 text-ink font-semibold rounded-xl transition-all text-sm"
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
                  <div key={artwork.id} className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface/60 shrink-0">
                      {primaryImage?.signed_url ? (
                        <img src={primaryImage.signed_url} alt={artwork.title || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-ink-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{artwork.title || 'Untitled'}</p>
                      <p className="text-xs text-ink-secondary mt-0.5">{artwork.view_count} views · {new Date(artwork.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        artwork.status === 'published' ? 'bg-emerald-muted text-emerald' :
                        artwork.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                        artwork.status === 'sold' ? 'bg-slate-500/10 text-ink-secondary' :
                        'bg-slate-500/10 text-ink-secondary'
                      }`}>
                        {artwork.status}
                      </span>
                      {artwork.price && (
                        <span className="text-sm font-bold text-ink mr-2">£{artwork.price.toLocaleString()}</span>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 border-l border-border-subtle pl-3">
                        {artwork.status === 'draft' && (
                          <button
                            disabled={publishingId === artwork.id}
                            onClick={() => handlePublish(artwork.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-muted hover:bg-emerald-500/20 text-emerald hover:text-emerald-300 transition-all text-[11px] font-bold disabled:opacity-30"
                          >
                            {publishingId === artwork.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/artworks/${artwork.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/60 hover:bg-surface-raised/70 text-ink-muted hover:text-ink transition-all text-[11px] font-bold"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          disabled={artwork.status === 'sold' || publishingId === artwork.id}
                          onClick={() => router.push(`/artist/artworks/${artwork.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-muted hover:bg-gold/[0.18] text-gold-400 hover:text-gold-300 transition-all text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
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
