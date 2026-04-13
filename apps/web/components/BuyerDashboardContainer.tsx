'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, Heart, TrendingUp, Search, LogOut,
  Settings, Star, ChevronRight, ImageIcon, SlidersHorizontal,
  Layers, Sparkles, X, Filter, Loader2
} from 'lucide-react'

interface Artwork {
  id: string
  title: string
  price: number | null
  status: string
  view_count: number
  images: { signed_url: string | null; is_primary: boolean }[]
  artist_id: string
  medium: string | null
  style: string | null
  is_favorited: boolean
}

export default function BuyerDashboardContainer({ session }: { session: any }) {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = session?.user
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: artworksData, isLoading: artworksLoading } = useQuery({
    queryKey: ['artworks', user?.id, search],
    queryFn: () => fetchApi(`/artworks?limit=24${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    enabled: !!session,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['my-purchases-count', user?.id],
    queryFn: () => fetchApi('/orders/mine?limit=1'),
    enabled: !!session,
  })

  const { data: favoritesData } = useQuery({
    queryKey: ['my-favorites-count', user?.id],
    queryFn: () => fetchApi('/artworks/me/favorites?limit=1'),
    enabled: !!session,
  })

  const artworks: Artwork[] = artworksData?.artworks || []
  
  const stats = [
    { label: 'Available', value: artworksData?.total || 0, icon: Layers, color: 'indigo' },
    { label: 'Favorites', value: favoritesData?.total || 0, icon: Heart, color: 'rose' },
    { label: 'Purchases', value: ordersData?.total || 0, icon: ShoppingBag, color: 'emerald' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleToggleFavorite = async (artworkId: string) => {
    if (togglingId) return
    setTogglingId(artworkId)
    try {
      await fetchApi(`/artworks/${artworkId}/favorite`, { method: 'POST' })
      queryClient.invalidateQueries({ queryKey: ['artworks'] })
      queryClient.invalidateQueries({ queryKey: ['my-favorites-count'] })
    } catch (error) {
       console.error("Failed to toggle favorite", error)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-3">
            Welcome back, <span className="text-indigo-400">Collector</span>
          </h2>
          <p className="text-slate-400">Discover new pieces and manage your acquisitions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/8 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="relative group max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by artist, title, or style..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg"
            />
            {searchInput && (
               <button 
                type="button" 
                onClick={() => { setSearchInput(''); setSearch('') }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
               >
                 <X className="w-4 h-4 text-slate-500" />
               </button>
            )}
          </form>
        </div>

        {/* Market Feed */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <h3 className="text-xl font-bold text-white">New in Gallery</h3>
            </div>
            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 group">
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {artworksLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map(artwork => {
                const primaryImage = artwork.images?.find(i => i.is_primary)
                return (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-4 hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden relative"
                    onClick={() => router.push(`/artworks/${artwork.id}`)}
                  >
                    <div className="aspect-square bg-slate-900 rounded-[2rem] overflow-hidden mb-4 relative">
                      {primaryImage?.signed_url ? (
                        <img 
                          src={primaryImage.signed_url} 
                          alt={artwork.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-slate-800" />
                        </div>
                      )}
                      
                      {/* Heart Indicator */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(artwork.id)
                        }}
                        disabled={togglingId === artwork.id}
                        className={`absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all ${
                          artwork.is_favorited 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-black/40 text-white hover:text-rose-400'
                        }`}
                      >
                        {togglingId === artwork.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className={`w-4 h-4 ${artwork.is_favorited ? 'fill-current' : ''}`} />
                        )}
                      </button>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                          View Details
                        </span>
                      </div>
                    </div>
                    <div className="px-2">
                       <h4 className="font-bold text-white truncate mb-1">{artwork.title}</h4>
                       <div className="flex items-center justify-between">
                         <p className="text-xs text-slate-500 uppercase tracking-widest font-bold font-mono py-1">{artwork.medium || 'Untitled'}</p>
                         <p className="text-sm font-black text-emerald-400">${artwork.price?.toLocaleString()}</p>
                       </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
