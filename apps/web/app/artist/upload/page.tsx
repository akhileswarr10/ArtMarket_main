'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle,
  ArrowLeft, PoundSterling, Palette, Tag, X, Plus, Send, Bot, Sparkles, Check
} from 'lucide-react'

type Status = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error' | 'confirming'

export default function ArtworkUploadPage() {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [medium, setMedium] = useState('')
  const [style, setStyle] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [price, setPrice] = useState('')

  const [selectedFiles, setSelectedFiles] = useState<{ file: File, preview: string }[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // AI State
  const [artworkId, setArtworkId] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [aiTagSuggestions, setAiTagSuggestions] = useState<string[]>([])
  const [aiFailed, setAiFailed] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return false
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('Files must be under 20MB')
        return false
      }
      return true
    }).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setSelectedFiles(prev => [...prev, ...newFiles])
    setError('')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [])


  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Poll AI status every 3 seconds until the job completes
  useEffect(() => {
    if (!artworkId || status !== 'analyzing') return

    const interval = setInterval(async () => {
      try {
        const aiStatus = await fetchApi(`/artworks/${artworkId}/ai-status`)

        // Check if at least one job is done
        const jobs: any[] = aiStatus.jobs || []
        const allDone = jobs.length > 0 && jobs.every((j: any) => j.status === 'done' || j.status === 'failed')
        const anyFailed = jobs.every((j: any) => j.status === 'failed')

        if (allDone) {
          clearInterval(interval)
          if (anyFailed) {
            setAiFailed(true)
            setStatus('idle')
          } else {
            setAiSuggestions(aiStatus)
            // Store tags separately for easy access
            setAiTagSuggestions(aiStatus.ai_tags_suggestion || [])
            // Auto-populate form fields
            if (aiStatus.ai_title_suggestion) setTitle(aiStatus.ai_title_suggestion)
            if (aiStatus.ai_description_suggestion) setDescription(aiStatus.ai_description_suggestion)
            if (aiStatus.ai_style_suggestion) setStyle(aiStatus.ai_style_suggestion)
            if (aiStatus.ai_medium_suggestion) setMedium(aiStatus.ai_medium_suggestion)
            if (aiStatus.ai_price_suggestion) setPrice(aiStatus.ai_price_suggestion.toString())
            // Auto-apply tags
            if (aiStatus.ai_tags_suggestion?.length) {
              setTags(prev => {
                const merged = [...prev]
                for (const t of aiStatus.ai_tags_suggestion) {
                  if (!merged.includes(t)) merged.push(t)
                }
                return merged
              })
            }
            setStatus('idle')
          }
        }
      } catch (e) {
        console.error('AI status poll failed:', e)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [artworkId, status])


  const handleInitialUploadAndAI = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image')
      return
    }

    setStatus('uploading')
    setError('')
    setProgress(10)

    try {
      // Step 1: Create artwork draft (empty for now, we'll fill it post-AI)
      const artwork = await fetchApi('/artworks', {
        method: 'POST',
        body: JSON.stringify({
          title: "Draft Artwork", // Placeholder required by backend
        }),
      })

      setArtworkId(artwork.id)
      setProgress(30)

      // Step 2: Upload images
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i]

        const presignData = await fetchApi(`/artworks/${artwork.id}/images/presign`, {
          method: 'POST',
        })

        const uploadResp = await fetch(presignData.signed_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        if (!uploadResp.ok) throw new Error(`Failed to upload ${file.name}`)

        // Confirming the image triggers AI on the backend
        await fetchApi(`/artworks/${artwork.id}/images/confirm`, {
          method: 'POST',
          body: JSON.stringify({ image_id: presignData.image_id }),
        })

        setProgress(30 + ((i + 1) / selectedFiles.length) * 40)
      }

      // Step 3: Wait for AI
      setStatus('analyzing')
      setProgress(100)

    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Upload failed. Please try again.')
    }
  }

  const handleUploadDraftOnly = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image')
      return
    }

    setStatus('uploading')
    setError('')
    setProgress(10)

    try {
      // Step 1: Create artwork draft
      const artwork = await fetchApi('/artworks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Draft Artwork' }),
      })

      setArtworkId(artwork.id)
      setProgress(30)

      // Step 2: Upload + confirm images (no AI trigger concern here since we skip)
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i]

        const presignData = await fetchApi(`/artworks/${artwork.id}/images/presign`, {
          method: 'POST',
        })

        const uploadResp = await fetch(presignData.signed_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        if (!uploadResp.ok) throw new Error(`Failed to upload ${file.name}`)

        await fetchApi(`/artworks/${artwork.id}/images/confirm`, {
          method: 'POST',
          body: JSON.stringify({ image_id: presignData.image_id }),
        })

        setProgress(30 + ((i + 1) / selectedFiles.length) * 70)
      }

      // Done — show form for manual entry, skip AI
      setTitle('')
      setStatus('idle')
      setProgress(100)

    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Upload failed. Please try again.')
    }
  }

  const resolveTagIds = async (tagNames: string[]): Promise<string[]> => {
    if (!tagNames.length) return []
    try {
      const resolved = await fetchApi('/tags/resolve', {
        method: 'POST',
        body: JSON.stringify(tagNames),
      })
      return resolved.map((t: any) => t.id)
    } catch (e) {
      console.error('Failed to resolve tags:', e)
      return []
    }
  }

  const handleSubmitMetadata = async (publish: boolean = false) => {
    if (!artworkId) return
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setStatus('uploading')
    try {
      const tag_ids = await resolveTagIds(tags)
      await fetchApi(`/artworks/${artworkId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: description || undefined,
          medium: medium || undefined,
          style: style || undefined,
          dimensions: dimensions || undefined,
          price: price ? parseFloat(price) : undefined,
          tag_ids,
        })
      })

      if (publish) {
        setStatus('confirming')
        await fetchApi(`/artworks/${artworkId}/publish`, { method: 'PATCH' })
      }
      setStatus('success')
      setTimeout(() => {
        router.push('/artist/dashboard')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err.message || "Failed to save artwork.")
    }
  }


  const applySuggestion = (field: string, value: string | number) => {
    if (field === 'title') setTitle(value as string)
    if (field === 'description') setDescription(value as string)
    if (field === 'style') setStyle(value as string)
    if (field === 'medium') setMedium(value as string)
    if (field === 'price') setPrice(value.toString())
  }

  const applyAllSuggestions = () => {
    if (!aiSuggestions) return
    if (aiSuggestions.ai_title_suggestion) setTitle(aiSuggestions.ai_title_suggestion)
    if (aiSuggestions.ai_description_suggestion) setDescription(aiSuggestions.ai_description_suggestion)
    if (aiSuggestions.ai_style_suggestion) setStyle(aiSuggestions.ai_style_suggestion)
    if (aiSuggestions.ai_medium_suggestion) setMedium(aiSuggestions.ai_medium_suggestion)
    if (aiSuggestions.ai_price_suggestion) setPrice(aiSuggestions.ai_price_suggestion.toString())
    if (aiTagSuggestions.length) {
      setTags(prev => {
        const merged = [...prev]
        for (const t of aiTagSuggestions) {
          if (!merged.includes(t)) merged.push(t)
        }
        return merged
      })
    }
  }

  return (
    <div className="min-h-screen bg-canvas-950 text-ink p-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-192 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-surface/60 hover:bg-surface-raised/70 transition-colors text-ink-secondary hover:text-ink"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Upload Artwork</h1>
            <p className="text-ink-secondary text-sm">Add a new piece to your portfolio</p>
          </div>
        </div>

        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-950/80 backdrop-blur-sm"
            >
              <div className="bg-surface border border-border rounded-3xl p-12 text-center max-w-sm">
                <div className="w-16 h-16 bg-emerald-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald" />
                </div>
                <h2 className="font-display text-xl font-semibold text-ink mb-2">Successfully Saved!</h2>
                <p className="text-ink-secondary text-sm">Redirecting to your dashboard...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Upload & Preview */}
          <div className="space-y-4">
            {!artworkId && (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById('file-input')?.click()}
                className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${dragOver
                  ? 'border-gold-500 bg-gold-muted'
                  : 'border-border hover:border-border-strong bg-surface/30 hover:bg-surface/60'
                  }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileSelect(e.target.files)}
                />
                <div className="w-16 h-16 rounded-2xl bg-surface/60 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-ink-secondary" />
                </div>
                <p className="text-ink font-semibold mb-1">Click or drag images to upload</p>
                <p className="text-ink-secondary text-sm">Max 20MB · JPEG, PNG, WebP</p>
              </div>
            )}

            {/* Selected Images Grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {selectedFiles.map((fileData, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group shadow-md border border-border">
                    <img src={fileData.preview} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                    {!artworkId && (
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-lg text-ink opacity-0 group-hover:opacity-100 transition-all font-bold"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-2 text-center">
                        <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">Primary</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons — AI or Draft */}
            {!artworkId && selectedFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleInitialUploadAndAI}
                  disabled={status === 'uploading'}
                  className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-copper hover:from-gold-500 hover:to-copper text-ink font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === 'uploading' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Analyze with AI ✨</>
                  )}
                </button>
                <button
                  onClick={handleUploadDraftOnly}
                  disabled={status === 'uploading'}
                  className="btn-ghost w-full disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> Upload as Draft (manual entry)
                </button>
              </div>
            )}

            {/* AI Status Banners */}
            {status === 'analyzing' && (
              <div className="p-4 bg-gold-muted border border-gold/30 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gold-500 animate-spin" />
                <p className="text-gold-200 text-sm font-medium">AI is analyzing your artwork to suggest metadata...</p>
              </div>
            )}

            {aiFailed && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">AI analysis couldn't complete.</p>
                  <p className="text-amber-400/80 text-xs mt-1">You can fill in the details manually.</p>
                </div>
              </div>
            )}

            {aiSuggestions && (
              <div className="p-5 bg-gradient-to-br from-gold-500/10 to-transparent border border-gold/20 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-gold-300 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Suggestions Ready
                  </h3>
                  <button
                    onClick={applyAllSuggestions}
                    className="btn-gold"
                  >
                    <Check className="w-3 h-3" /> Apply All
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'title', val: aiSuggestions.ai_title_suggestion, label: 'Title' },
                    { key: 'style', val: aiSuggestions.ai_style_suggestion, label: 'Style' },
                    { key: 'medium', val: aiSuggestions.ai_medium_suggestion, label: 'Medium' },
                    { key: 'price', val: aiSuggestions.ai_price_suggestion, label: `Price ($${aiSuggestions.ai_price_suggestion})` },
                  ].map(s => s.val && (
                    <div key={s.key} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-border-subtle">
                      <div>
                        <span className="text-[10px] text-ink-secondary uppercase tracking-wider block mb-0.5">{s.label}</span>
                        <span className="text-sm text-ink-muted">{s.key === 'price' ? `$${s.val}` : s.val}</span>
                      </div>
                      <button
                        onClick={() => applySuggestion(s.key, s.val)}
                        className="text-gold-400 hover:text-gold-300 text-xs font-medium px-2 py-1 rounded bg-gold-muted hover:bg-gold/[0.18] transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                  {aiSuggestions.ai_description_suggestion && (
                    <div className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-ink-secondary uppercase tracking-wider">Description</span>
                        <button
                          onClick={() => applySuggestion('description', aiSuggestions.ai_description_suggestion)}
                          className="text-gold-400 hover:text-gold-300 text-xs font-medium px-2 py-1 rounded bg-gold-muted hover:bg-gold/[0.18] transition-colors"
                        >
                          Use
                        </button>
                      </div>
                      <p className="text-sm text-ink-muted italic line-clamp-2">"{aiSuggestions.ai_description_suggestion}"</p>
                    </div>
                  )}

                  {/* AI Tag Suggestions */}
                  {aiTagSuggestions.length > 0 && (
                    <div className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-ink-secondary uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3 h-3" />Suggested Tags
                        </span>
                        <button
                          onClick={() => setTags(prev => {
                            const merged = [...prev]
                            for (const t of aiTagSuggestions) { if (!merged.includes(t)) merged.push(t) }
                            return merged
                          })}
                          className="text-gold-400 hover:text-gold-300 text-xs font-medium px-2 py-1 rounded bg-gold-muted hover:bg-gold/[0.18] transition-colors"
                        >
                          Add All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiTagSuggestions.map((tag) => {
                          const isApplied = tags.includes(tag)
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (!isApplied) setTags(prev => [...prev, tag])
                              }}
                              disabled={isApplied}
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border ${
                                isApplied
                                  ? 'bg-emerald-500/15 text-emerald border-emerald-500/20 cursor-default'
                                  : 'bg-gold-muted text-gold-300 border-gold/20 hover:bg-gold-500/25 cursor-pointer'
                              }`}
                            >
                              {isApplied ? '✓' : '+'} #{tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Metadata Form */}
          <div className={`space-y-5 transition-opacity duration-500 opacity-100`}>
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
              { label: 'Price (GBP £)', value: price, set: setPrice, placeholder: 'e.g. 950', type: 'number', icon: PoundSterling },
              { label: 'Medium', value: medium, set: setMedium, placeholder: 'e.g. Oil on Canvas', type: 'text', icon: Palette },
              { label: 'Style', value: style, set: setStyle, placeholder: 'e.g. Impressionism', type: 'text' },
              { label: 'Dimensions', value: dimensions, set: setDimensions, placeholder: 'e.g. 24" × 36"', type: 'text' },
            ].map(({ label, value, set, placeholder, type, icon: Icon }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest">{label}</label>
                <div className="relative">
                  {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-secondary" />}
                  <input
                    type={type}
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-surface/60 border border-border focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/10 rounded-xl outline-none transition-all text-ink placeholder:text-ink-secondary text-sm`}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story behind this artwork..."
                rows={3}
                className="input-galerie w-full resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest flex items-center gap-1.5"><Tag className="w-3 h-3" />Tags</label>
              <div className="flex flex-wrap gap-2 p-3 bg-surface/60 border border-border focus-within:border-gold-500/40 rounded-xl min-h-[48px]">
                {tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-gold-500/15 text-gold-300 text-xs font-semibold rounded-lg border border-gold/20">
                    #{tag}
                    <button onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="text-gold-400/60 hover:text-rose transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '')
                      if (!tags.includes(newTag)) setTags([...tags, newTag])
                      setTagInput('')
                    }
                  }}
                  placeholder={tags.length === 0 ? 'Add tags (press Enter or ,)' : '+ more...'}
                  className="input-galerie"
                />
              </div>
            </div>

            {/* Submit Actions */}
            {artworkId && (
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => handleSubmitMetadata(false)}
                  disabled={status === 'uploading'}
                  className="flex-1 py-3.5 bg-surface/60 hover:bg-surface-raised/70 border border-border text-ink font-semibold rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmitMetadata(true)}
                  disabled={status === 'uploading' || !title}
                  className="flex-1 py-3.5 bg-gold-500 hover:bg-gold-500 text-ink font-semibold rounded-xl transition-all shadow-lg shadow-gold-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Publish Artwork
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}