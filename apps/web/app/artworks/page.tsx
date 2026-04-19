'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Search, X, ImageIcon, ChevronLeft,
  ChevronRight, Sparkles, Heart, Loader2, Tag
} from 'lucide-react'
import FavoriteButton from '@/components/FavoriteButton'

interface Artwork {
  id: string
  title: string | null
  price: number | null
  medium: string | null
  style: string | null
  is_favorited: boolean
  images: { signed_url: string | null; is_primary: boolean }[]
  tags: { id: string; name: string }[]
}

const MEDIUMS = ['Oil', 'Watercolor', 'Acrylic', 'Digital', 'Sculpture', 'Photography', 'Mixed Media']
const STYLES = ['Abstract', 'Realism', 'Impressionism', 'Contemporary', 'Minimalism', 'Surrealism']

function ArtworksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [session, setSession] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [medium, setMedium] = useState('')
  const [style, setStyle] = useState('')
  const [activeTag, setActiveTag] = useState(() => searchParams.get('tag_name') || '')
  const [skip, setSkip] = useState(0)
  const limit = 12

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  // Sync tag from URL when navigating from detail page
  useEffect(() => {
    const urlTag = searchParams.get('tag_name')
    if (urlTag) setActiveTag(urlTag)
  }, [searchParams])

  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('skip', String(skip))
  if (search) params.set('search', search)
  if (medium) params.set('medium', medium)
  if (style) params.set('style', style)
  if (activeTag) params.set('tag_name', activeTag)

  const { data, isLoading } = useQuery({
    queryKey: ['artworks', session?.user?.id, search, medium, style, activeTag, skip],
    queryFn: () => fetchApi(`/artworks?${params.toString()}`),
  })

  const artworks: Artwork[] = data?.artworks || []
  const total: number = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(skip / limit) + 1

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setActiveTag('')
    setSkip(0)
  }

  const handleTagClick = (tagName: string) => {
    setActiveTag(activeTag === tagName ? '' : tagName)
    setSearch('')
    setSearchInput('')
    setSkip(0)
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

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setMedium(''); setStyle(''); setActiveTag(''); setSkip(0)
  }

  const hasFilters = search || medium || style || activeTag

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="container mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            {total > 0 ? `${total} artworks` : 'Gallery'}
          </div>
          <h2 className="text-4xl font-black text-white mb-3">Discover Original Art</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Curated originals from independent artists across every medium and style
          </p>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by title, medium, style..."
                className="w-full pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setSkip(0) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit"
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all">
              Search
            </button>
          </form>

          <div className="flex gap-2">
            <select value={medium} onChange={e => { setMedium(e.target.value); setSkip(0) }}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/40 transition-all appearance-none cursor-pointer min-w-[120px]">
              <option value="" className="bg-slate-800">All Mediums</option>
              {MEDIUMS.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
            </select>
            <select value={style} onChange={e => { setStyle(e.target.value); setSkip(0) }}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-indigo-500/40 transition-all appearance-none cursor-pointer min-w-[120px]">
              <option value="" className="bg-slate-800">All Styles</option>
              {STYLES.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Active tag filter pill */}
        <AnimatePresence>
          {activeTag && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 mb-5"
            >
              <span className="text-xs text-slate-500">Filtered by tag:</span>
              <button
                onClick={() => setActiveTag('')}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-full text-xs font-semibold hover:bg-indigo-500/30 transition-all"
              >
                <Tag className="w-3 h-3" />#{activeTag}
                <X className="w-3 h-3 ml-0.5 opacity-60" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">No artworks found</h3>
            <p className="text-slate-500 text-sm mb-5">
              {hasFilters ? 'Try adjusting your filters' : 'No published artworks yet'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {artworks.map(artwork => {
                const primaryImage = artwork.images?.find(i => i.is_primary)
                const artworkTags = artwork.tags || []
                return (
                  <motion.div
                    key={artwork.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col"
                    onClick={() => router.push(`/artworks/${artwork.id}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-800 relative shrink-0">
                      {primaryImage?.signed_url ? (
                        <img src={primaryImage.signed_url} alt={artwork.title || 'Artwork'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-slate-700" />
                        </div>
                      )}
                      {/* Heart */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleFavorite(artwork.id) }}
                          disabled={togglingId === artwork.id}
                          className={`p-1.5 backdrop-blur-md rounded-lg transition-all ${
                            artwork.is_favorited ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:text-rose-400'
                          }`}>
                          {togglingId === artwork.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                            <Heart className={`w-3 h-3 ${artwork.is_favorited ? 'fill-current' : ''}`} />
                          )}
                        </button>
                      
                      {/* Heart Toggle */}
                      <div className="absolute top-2 right-2 z-10">
                         <FavoriteButton
                            artworkId={artwork.id}
                            initialIsFavorited={artwork.is_favorited}
                            size="sm"
                          />
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <h3 className="font-semibold text-white truncate text-sm">{artwork.title || 'Untitled'}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 truncate">{artwork.medium || '—'}</span>
                        {artwork.price !== null ? (
                          <span className="text-xs font-bold text-emerald-400 ml-2 shrink-0">£{artwork.price.toLocaleString()}</span>
                        ) : (
                          <span className="text-xs text-slate-600 ml-2 shrink-0">Price TBD</span>
                        )}
                      </div>
                      {/* Tags */}
                      {artworkTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
                          {artworkTags.slice(0, 3).map(tag => (
                            <button
                              key={tag.id}
                              onClick={() => handleTagClick(tag.name)}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                activeTag === tag.name
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25'
                              }`}
                            >
                              #{tag.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />Previous
                </button>
                <span className="text-sm text-slate-400">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setSkip(skip + limit)} disabled={currentPage >= totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function ArtworksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
      <ArtworksContent />
    </Suspense>
  )
}