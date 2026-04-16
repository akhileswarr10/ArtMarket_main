'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Heart, ArrowLeft, ImageIcon, Loader2, Sparkles,
  ShoppingBag, Trash2, ChevronRight, Palette, Eye
} from 'lucide-react'
import FavoriteButton from '@/components/FavoriteButton'
import { useState, useEffect } from 'react'

interface Artwork {
  id: string
  title: string | null
  price: number | null
  medium: string | null
  style: string | null
  is_favorited: boolean
  images: { signed_url: string | null; is_primary: boolean }[]
}

export default function FavoritesPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['favorites', session?.user?.id],
    queryFn: () => fetchApi('/artworks/me/favorites'),
    enabled: !!session,
  })

  const favorites: Artwork[] = favoritesData?.favorites || []

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" />
              Wishlist
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">Masterpieces <br /><span className="text-rose-500 uppercase text-6xl tracking-tighter">You Love</span></h1>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
             <div className="w-12 h-12 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
             <p className="text-slate-500 text-sm">Loading your collection...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white/3 border border-dashed border-white/10 rounded-[3rem]">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700 mb-6">
              <Heart className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-sm">Find pieces that speak to you and save them here for later curation.</p>
            <button
              onClick={() => router.push('/artworks')}
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-500/10 transition-all hover:scale-105"
            >
              Explore Gallery
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             <AnimatePresence mode="popLayout">
              {favorites.map((artwork) => {
                const primaryImage = artwork.images?.find(i => i.is_primary)
                return (
                  <motion.div
                    key={artwork.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="group bg-white/5 border border-white/10 rounded-[2rem] p-4 hover:border-rose-500/30 transition-all cursor-pointer relative"
                    onClick={() => router.push(`/artworks/${artwork.id}`)}
                  >
                    <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative">
                       {primaryImage?.signed_url ? (
                         <img 
                          src={primaryImage.signed_url} 
                          alt={artwork.title || 'Artwork'} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-slate-800" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                            Click to Expand
                          </span>
                       </div>
                       
                       {/* Rapid Toggle Button */}
                       <div className="absolute top-3 right-3 z-10">
                         <FavoriteButton 
                            artworkId={artwork.id} 
                            initialIsFavorited={true} 
                          />
                       </div>
                    </div>
                    
                    <div className="mt-4 px-1">
                       <h3 className="font-bold text-white truncate text-sm">{artwork.title || 'Untitled'}</h3>
                       <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-slate-500">{artwork.medium || 'Medium'}</p>
                          {artwork.price && (
                            <p className="text-xs font-black text-emerald-400">${artwork.price.toLocaleString()}</p>
                          )}
                       </div>
                    </div>
                  </motion.div>
                )
              })}
             </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}