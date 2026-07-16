'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api/client'
import { ImageIcon } from 'lucide-react'

interface ArtworkImage {
  signed_url: string | null
  is_primary: boolean
}

interface SimilarArtwork {
  id: string
  title: string | null
  price: number | null
  medium: string | null
  images: ArtworkImage[]
  tags: { id: string; name: string }[]
}

interface Props {
  title: string
  artworkId: string
  endpoint: 'similar' | 'similar-price'
}

export default function ArtworkRecommendationRail({ title, artworkId, endpoint }: Props) {
  const router = useRouter()

  const { data, isLoading } = useQuery<{ artworks: SimilarArtwork[] }>({
    queryKey: [endpoint, artworkId],
    queryFn: () => fetchApi(`/artworks/${artworkId}/${endpoint}`),
    staleTime: 5 * 60 * 1000, // 5 min — similarity results don't change often
  })

  const artworks = data?.artworks ?? []

  // Skeleton rail — matches the skeleton pattern used in artworks/page.tsx
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-36 bg-surface/60 rounded skeleton" />
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden skeleton shrink-0 w-44"
            >
              <div className="aspect-square bg-surface/60" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-surface/60 rounded w-3/4" />
                <div className="h-3 bg-surface/60 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render nothing when there are no results — intentional per spec
  if (artworks.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold text-ink-secondary uppercase tracking-widest">
        {title}
      </h3>

      {/* Horizontally scrollable rail */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {artworks.map((artwork) => {
          const primaryImage =
            artwork.images?.find((i) => i.is_primary) || artwork.images?.[0]

          return (
            <div
              key={artwork.id}
              onClick={() => router.push(`/artworks/${artwork.id}`)}
              className="group bg-surface border border-border-subtle rounded-2xl shadow-card overflow-hidden cursor-pointer flex flex-col hover:border-border-strong hover:shadow-card-hover transition-all duration-300 shrink-0 w-44"
            >
              {/* Square image — same aspect-square + scale-on-hover as browse grid */}
              <div className="aspect-square overflow-hidden bg-surface-raised relative">
                {primaryImage?.signed_url ? (
                  <img
                    src={primaryImage.signed_url}
                    alt={artwork.title || 'Artwork'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Card body — matches p-3 / gap-1.5 structure from browse grid */}
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <h4 className="font-semibold text-ink truncate text-sm">
                  {artwork.title || 'Untitled'}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-secondary truncate">
                    {artwork.medium || '—'}
                  </span>
                  {artwork.price !== null ? (
                    <span className="text-xs font-bold text-emerald ml-2 shrink-0">
                      £{artwork.price.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-secondary ml-2 shrink-0">
                      Price TBD
                    </span>
                  )}
                </div>

                {/* Tags — same gold chip style as browse grid, capped at 2 for space */}
                {artwork.tags.length > 0 && (
                  <div
                    className="flex flex-wrap gap-1 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {artwork.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-gold-muted text-gold-400 border border-gold/20"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
