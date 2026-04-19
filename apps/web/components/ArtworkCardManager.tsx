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
      className="group relative bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-[0_30px_60px_rgb(0,0,0,0.08)] transition-all duration-500"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
        {artwork.images?.[0]?.signed_url ? (
          <Image
            src={artwork.images[0].signed_url}
            alt={artwork.title || 'Artwork'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Globe className="w-12 h-12" />
          </div>
        )}
        
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${
          isPublished 
            ? 'bg-emerald-500/80 text-white border-emerald-400/30' 
            : 'bg-slate-900/80 text-slate-100 border-white/20'
        }`}>
          {artwork.status}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-black text-lg text-slate-900 truncate">{artwork.title || 'Untitled Artwork'}</h3>
        <p className="text-slate-400 text-sm font-medium mt-1 mb-4 flex items-center gap-2">
          {artwork.medium} 
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          £{artwork.price?.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit?.(artwork.id)}
            className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          
          <div className="flex gap-2">
            {!isPublished && (
              <button 
                onClick={() => onPublish?.(artwork.id)}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
                title="Publish Artwork"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => onDelete?.(artwork.id)}
              className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all flex items-center justify-center"
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
