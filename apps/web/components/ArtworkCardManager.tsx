'use client'

import { motion } from 'framer-motion'
import { Eye, Edit3, Trash2, Globe, FileText, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'

interface ArtworkCardManagerProps {
  artwork: any
  index: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPublish?: (id: string) => void
}

export default function ArtworkCardManager({ artwork, index, onEdit, onDelete, onPublish }: ArtworkCardManagerProps) {
  const isPublished = artwork.status === 'published'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-surface border border-border-subtle rounded-3xl shadow-card overflow-hidden hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] hover:border-border-strong hover:shadow-card-hover transition-all duration-300"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-canvas-100">
        {artwork.images?.[0]?.signed_url ? (
          <Image
            src={artwork.images[0].signed_url}
            alt={artwork.title || 'Artwork'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
            <Globe className="w-12 h-12" />
          </div>
        )}
        
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${
          isPublished 
            ? 'bg-emerald-500/80 text-ink border-emerald/30' 
            : 'bg-slate-900/80 text-slate-100 border-border-strong'
        }`}>
          {artwork.status}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-lg text-ink truncate">{artwork.title || 'Untitled Artwork'}</h3>
        <p className="text-ink-secondary text-sm font-medium mt-1 mb-4 flex items-center gap-2">
          {artwork.medium} 
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          £{artwork.price?.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit?.(artwork.id)}
            className="flex-1 py-3 px-4 bg-surface-raised hover:bg-surface-overlay text-ink-secondary hover:text-ink border border-border-subtle rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          
          <div className="flex gap-2">
            {!isPublished && (
              <button 
                onClick={() => onPublish?.(artwork.id)}
                className="w-10 h-10 bg-emerald-muted hover:bg-emerald/20 text-emerald border border-emerald/20 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
                title="Publish Artwork"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => onDelete?.(artwork.id)}
              className="w-10 h-10 bg-rose-muted hover:bg-rose/20 text-rose border border-rose/20 rounded-xl transition-all flex items-center justify-center"
              title="Delete Artwork"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
