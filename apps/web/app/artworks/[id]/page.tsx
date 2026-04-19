'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchApi } from '@/lib/api/client'
import {
  ArrowLeft, Heart, ShoppingCart, Eye, Palette, Maximize2,
  Sparkles, Share2, Clock, ShieldCheck, AlertCircle, Package,
  Trash2, Edit3, Loader2, Check
} from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { addToCart } from '@/lib/api/client'
import FavoriteButton from '@/components/FavoriteButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ArtworkImage {
  id: string
  is_primary: boolean
  storage_path: string
  signed_url?: string | null
}

interface Artwork {
  id: string
  artist_id: string
  title: string | null
  description: string | null
  price: number | null
  status: string
  view_count: number
  medium: string | null
  style: string | null
  dimensions: string | null
  created_at: string
  images: ArtworkImage[]
  tags: { id: string; name: string }[]
  is_favorited?: boolean
}

export default function ArtworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const { addItemOptimistic } = useCartStore()

  useEffect(() => {
    fetchData()
  }, [params.id])

  const handleAddToCart = async () => {
    if (!artwork) return
    setIsAdding(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      await addToCart(artwork.id)
      
      const primaryImage = artwork.images?.find(i => i.is_primary) || artwork.images?.[0]
      
      addItemOptimistic({
        id: Math.random().toString(36).substr(2, 9), // Temp ID
        cart_id: '',
        artwork_id: artwork.id,
        price_at_add: artwork.price || 0,
        added_at: new Date().toISOString(),
        artwork: {
          id: artwork.id,
          title: artwork.title,
          price: artwork.price,
          status: artwork.status,
          artist_id: artwork.artist_id,
          primary_image_url: primaryImage?.signed_url || null
        }
      })
      
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err: any) {
      if (!err.message?.includes('already in cart')) {
        alert(err.message || 'Failed to add to cart')
      } else {
        // If already in cart, just open it
        useCartStore.getState().setIsOpen(true)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Fetch internal user profile to get internal UUID
      let internalUser = null
      if (session) {
        internalUser = await fetchApi('/users/me')
        setCurrentUser(internalUser)
      }

      const response = await fetch(`${API_URL}/artworks/${params.id}`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      
      if (!response.ok) {
        setError('Artwork not found')
        return
      }
      const data = await response.json()
      setArtwork(data)
    } catch (err) {
      setError('Failed to load artwork')
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetchApi(`/artworks/${params.id}`, { method: 'DELETE' })
      router.push('/artist/dashboard')
    } catch (err) {
      setError('Failed to delete artwork')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Palette className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-slate-500 text-sm">Loading masterpiece...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Artwork Unavailable</h1>
        <p className="text-slate-400 text-sm mb-8">This piece may have been removed or set to private.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all text-sm"
        >
          Go Back
        </button>
      </div>
    )
  }

  const isOwner = currentUser?.id === artwork.artist_id
  const canManage = isOwner && artwork.status !== 'sold'
  const primaryImage = artwork.images?.find(i => i.is_primary) || artwork.images?.[0]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Remove Listing?</h3>
              <p className="text-slate-400 text-sm mb-8">This action will permanently remove the artwork from the marketplace. This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white">
              <Palette className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight">ArtMarket</span>
          </div>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-28 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Gallery Section */}
          <div className="space-y-4 sticky top-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[4/5] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden relative group"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={artwork.images[selectedImage]?.signed_url || primaryImage?.signed_url || ''}
                  alt=""
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </motion.div>

            {artwork.images.length > 1 && (
              <div className="flex gap-3">
                {artwork.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-indigo-500 scale-105' : 'border-white/10 opacity-50'
                    }`}
                  >
                    <img src={img.signed_url || ''} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pt-4"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Verified Original
              </div>
              {artwork.status === 'sold' && (
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  Sold Out
                </div>
              )}
            </div>

            <div>
              <h1 className="text-5xl font-black text-white leading-none tracking-tight mb-6">
                {artwork.title}
              </h1>
              <div className="flex items-center gap-6">
                <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                  £{artwork.price?.toLocaleString()}
                </p>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <Eye className="w-4 h-4 text-slate-600" />
                  {artwork.view_count} Impressions
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Curator's Note</h3>
              <p className="text-slate-300 leading-relaxed text-sm">{artwork.description}</p>
            </div>

            {/* Tags */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => router.push(`/artworks?tag_name=${encodeURIComponent(tag.name)}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg hover:bg-indigo-500/25 hover:border-indigo-500/40 transition-all"
                  >
                    <span className="text-indigo-500/60">#</span>{tag.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Medium', value: artwork.medium, icon: Palette },
                { label: 'Dimensions', value: artwork.dimensions, icon: Maximize2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/2 border border-white/5 rounded-2xl p-5">
                  <Icon className="w-4 h-4 text-slate-600 mb-3" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-bold text-white text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {isOwner ? (
                <>
                  <button
                    disabled={!canManage}
                    onClick={() => router.push(`/artist/artworks/${params.id}/edit`)}
                    className="flex-1 py-4 bg-white text-slate-900 font-black rounded-2xl transition-all hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Details
                  </button>
                  <button
                    disabled={!canManage}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              ) : artwork.status === 'sold' ? (
                <div className="flex-1 py-4 bg-slate-900 text-slate-600 font-black rounded-2xl border border-white/5 flex items-center justify-center gap-2 uppercase tracking-widest cursor-not-allowed">
                  <Package className="w-4 h-4" />
                  Item Sold
                </div>
              ) : (
                <>
                  <FavoriteButton
                    artworkId={artwork.id}
                    initialIsFavorited={artwork.is_favorited || false}
                    size="lg"
                  />
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || artwork.status === 'sold'}
                    className={`flex-1 py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${
                      added 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : added ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => router.push(`/purchase?artworkId=${artwork.id}`)}
                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Buy Now
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            <div className="p-6 bg-slate-900/50 border border-white/5 rounded-[2rem] flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                 <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Our <span className="text-indigo-400">Masterpiece Verification</span> system ensures this artwork is a unique original from the artist. 
                All transactions are encrypted and recorded on your private collector receipt.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}