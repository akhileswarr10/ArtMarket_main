'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { fetchApi } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  artworkId: string
  initialIsFavorited: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function FavoriteButton({ 
  artworkId, 
  initialIsFavorited, 
  size = 'md',
  className = '' 
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    if (loading) return
    setLoading(true)

    // Optimistic update
    const previousState = isFavorited
    setIsFavorited(!previousState)

    try {
      await fetchApi(`/artworks/${artworkId}/favorite`, { method: 'POST' })
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['artworks'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['my-favorites-count'] })
    } catch (error) {
      // Rollback on error
      setIsFavorited(previousState)
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-4 rounded-2xl'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        relative overflow-hidden transition-all duration-300 active:scale-90
        backdrop-blur-md border shadow-lg
        ${isFavorited 
          ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/20' 
          : 'bg-black/40 border-white/10 text-white hover:text-rose-400 hover:border-rose-500/30'
        }
        ${sizes[size]}
        ${className}
      `}
    >
      <div className="relative z-10">
        {loading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : (
          <Heart 
            className={`${iconSizes[size]} transition-all duration-300 ${isFavorited ? 'fill-current' : 'hover:scale-110'}`} 
          />
        )}
      </div>
      
      {/* Animated Glow when favorited */}
      {isFavorited && (
        <span className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent animate-pulse pointer-events-none" />
      )}
    </button>
  )
}
