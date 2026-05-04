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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '') + '/api'

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
      <div className="min-h-screen bg-canvas-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-muted flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Palette className="w-8 h-8 text-gold-400" />
          </div>
          <p className="text-ink-secondary text-sm">Loading masterpiece...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-canvas-950 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Artwork Unavailable</h1>
        <p className="text-ink-secondary text-sm mb-8">This piece may have been removed or set to private.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-surface/60 hover:bg-surface-raised/70 border border-border rounded-xl text-ink font-semibold transition-all text-sm"
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
    <div className="min-h-screen bg-canvas-950 text-ink">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-canvas-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border p-8 rounded-[2.5rem] max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink mb-2">Remove Listing?</h3>
              <p className="text-ink-secondary text-sm mb-8">This action will permanently remove the artwork from the marketplace. This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-surface/60 hover:bg-surface-raised/70 text-ink rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-gold"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 bg-canvas-950/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-ink-secondary hover:text-ink transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-600 to-copper rounded-xl flex items-center justify-center text-ink">
              <Palette className="w-4 h-4" />
            </div>
            <span className="font-bold text-ink tracking-tight">ArtMarket</span>
          </div>
          <button className="p-2 rounded-xl bg-surface/60 hover:bg-surface-raised/70 text-ink-secondary hover:text-ink transition-all">
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
              className="aspect-[4/5] bg-surface border border-border rounded-3xl overflow-hidden relative group"
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
                      selectedImage === i ? 'border-gold-500 scale-105' : 'border-border opacity-50'
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
              <div className="badge-emerald">
                <ShieldCheck className="w-3 h-3" />
                Verified Original
              </div>
              {artwork.status === 'sold' && (
                <div className="badge-gold">
                  Sold Out
                </div>
              )}
            </div>

            <div>
              <h1 className="font-display text-6xl font-bold text-ink leading-none tracking-tight mb-6">
                {artwork.title}
              </h1>
              <div className="flex items-center gap-6">
                <p className="font-mono text-3xl font-semibold text-emerald tracking-tighter">
                  {artwork.price !== null ? `£${artwork.price.toLocaleString()}` : 'Price Pending'}
                </p>
                <div className="h-4 w-px bg-surface-raised/70" />
                <div className="flex items-center gap-2 text-ink-secondary font-bold uppercase text-[10px] tracking-widest">
                  <Eye className="w-4 h-4 text-ink-secondary" />
                  {artwork.view_count} Impressions
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border-subtle rounded-3xl shadow-card p-8">
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4">Curator's Note</h3>
              <p className="text-ink-muted leading-relaxed text-sm">{artwork.description || 'No description provided.'}</p>
            </div>

            {/* Tags */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => router.push(`/artworks?tag_name=${encodeURIComponent(tag.name)}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gold-muted border border-gold/20 text-gold-300 text-xs font-semibold rounded-lg hover:bg-gold-500/25 hover:border-gold-500/40 transition-all"
                  >
                    <span className="text-gold-500/60">#</span>{tag.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Medium', value: artwork.medium || 'Not specified', icon: Palette },
                { label: 'Dimensions', value: artwork.dimensions || 'Not specified', icon: Maximize2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-surface/30 border border-border-subtle rounded-2xl p-5">
                  <Icon className="w-4 h-4 text-ink-secondary mb-3" />
                  <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-bold text-ink text-sm">{value}</p>
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
                    className="flex-1 py-4 bg-canvas-50 text-ink font-bold rounded-2xl transition-all hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="flex-1 py-4 bg-surface text-ink-secondary font-bold rounded-2xl border border-border-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-not-allowed">
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
                    disabled={isAdding || artwork.status !== 'published' || artwork.price === null}
                    className="btn-gold"
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : added ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    {added ? 'Added' : 
                     artwork.status === 'draft' ? 'Draft Only' :
                     artwork.price === null ? 'Price Pending' :
                     'Add to Cart'}
                  </button>
                  <button
                    disabled={artwork.status !== 'published' || artwork.price === null}
                    onClick={() => router.push(`/purchase?artworkId=${artwork.id}`)}
                    className="flex-1 py-4 bg-gradient-to-r from-gold-600 to-copper hover:from-gold-500 hover:to-copper text-ink font-bold rounded-2xl shadow-xl shadow-gold-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            <div className="p-6 bg-slate-900/50 border border-border-subtle rounded-[2rem] flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold-muted flex items-center justify-center shrink-0">
                 <Sparkles className="w-6 h-6 text-gold-400" />
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed font-medium">
                Our <span className="text-gold-400">Masterpiece Verification</span> system ensures this artwork is a unique original from the artist. 
                All transactions are encrypted and recorded on your private collector receipt.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}