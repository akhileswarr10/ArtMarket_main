'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle,
  ArrowLeft, DollarSign, Palette, Tag, X, Plus, Send
} from 'lucide-react'

type Status = 'idle' | 'uploading' | 'confirming' | 'success' | 'error'

export default function ArtworkUploadPage() {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [medium, setMedium] = useState('')
  const [style, setStyle] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [price, setPrice] = useState('')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB')
      return
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleSubmit = async (publish: boolean = false) => {
    if (!selectedFile) {
      setError('Please select an image')
      return
    }
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setStatus('uploading')
    setError('')
    setProgress(20)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    try {
      // Step 1: Create artwork draft
      const artwork = await fetchApi('/artworks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          medium: medium || undefined,
          style: style || undefined,
          dimensions: dimensions || undefined,
          price: price ? parseFloat(price) : undefined,
        }),
      })
      setProgress(40)

      // Step 2: Get presigned upload URL
      const presignData = await fetchApi(`/artworks/${artwork.id}/images/presign`, {
        method: 'POST',
      })
      setProgress(60)

      // Step 3: Upload directly to Supabase Storage
      const uploadResp = await fetch(presignData.signed_url, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      })
      if (!uploadResp.ok) throw new Error('Failed to upload image to storage')
      setProgress(80)

      // Step 4: Confirm the upload
      setStatus('confirming')
      await fetchApi(`/artworks/${artwork.id}/images/confirm`, {
        method: 'POST',
        body: JSON.stringify({ image_id: presignData.image_id }),
      })
      setProgress(90)

      // Step 5: Publish if requested
      if (publish) {
        await fetchApi(`/artworks/${artwork.id}/publish`, { method: 'PATCH' })
      }
      setProgress(100)
      setStatus('success')

      setTimeout(() => {
        router.push('/artist/dashboard')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Upload failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-192 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Artwork</h1>
            <p className="text-slate-400 text-sm">Add a new piece to your portfolio</p>
          </div>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center max-w-sm">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Successfully uploaded!</h2>
                <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Image Upload */}
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : preview
                  ? 'border-white/10'
                  : 'border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/5'
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {preview ? (
                <div className="relative w-full h-full">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-white font-semibold mb-1">Drop your artwork here</p>
                  <p className="text-slate-500 text-sm">or click to browse</p>
                  <p className="text-slate-600 text-xs mt-3">Max 20MB · JPEG, PNG, WebP</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {(status === 'uploading' || status === 'confirming') && (
              <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              </div>
            )}
          </div>

          {/* Right: Metadata Form */}
          <div className="space-y-5">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {[
              { label: 'Title *', value: title, set: setTitle, placeholder: 'e.g. Sunset Over the Valley', type: 'text' },
              { label: 'Price (USD)', value: price, set: setPrice, placeholder: 'e.g. 1200', type: 'number', icon: DollarSign },
              { label: 'Medium', value: medium, set: setMedium, placeholder: 'e.g. Oil on Canvas', type: 'text', icon: Palette },
              { label: 'Style', value: style, set: setStyle, placeholder: 'e.g. Impressionism', type: 'text' },
              { label: 'Dimensions', value: dimensions, set: setDimensions, placeholder: 'e.g. 24" × 36"', type: 'text' },
            ].map(({ label, value, set, placeholder, type, icon: Icon }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                <div className="relative">
                  {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
                  <input
                    type={type}
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 rounded-xl outline-none transition-all text-white placeholder:text-slate-600 text-sm`}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story behind this artwork..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 rounded-xl outline-none transition-all text-white placeholder:text-slate-600 text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={status === 'uploading' || status === 'confirming'}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'uploading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <>Save as Draft</>
                )}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={status === 'uploading' || status === 'confirming'}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'confirming' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Upload & Publish</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}