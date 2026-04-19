'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, CheckCircle, AlertCircle,
  ArrowLeft, PoundSterling, Palette, Sparkles, Send, Bot, X, Plus, Tag
} from 'lucide-react'

type Status = 'idle' | 'loading' | 'saving' | 'success' | 'error'

export default function ArtworkEditPage() {
  const router = useRouter()
  const params = useParams()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [medium, setMedium] = useState('')
  const [style, setStyle] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSold, setIsSold] = useState(false)

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const generateAISuggestions = async () => {
    if (isSold) return
    setIsGeneratingAI(true)
    setError('')
    
    try {
      // Trigger the job
      const initialJob = await fetchApi(`/artworks/${params.id}/ai-suggestions`)
      
      let jobId = initialJob.id
      let jobStatus = initialJob.status
      
      // Poll every 2 seconds until done or failed
      while (jobStatus === 'queued' || jobStatus === 'running') {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const job = await fetchApi(`/ai/jobs/${jobId}`)
        jobStatus = job.status
        
        if (jobStatus === 'done') {
          if (job.result) {
            setTitle(job.result.title || title)
            setDescription(job.result.description || description)
            if (job.result.suggested_price) {
              setPrice(job.result.suggested_price.toString())
            }
            if (job.result.detected_style) {
              setStyle(job.result.detected_style)
            }
            if (job.result.tags && Array.isArray(job.result.tags)) {
              setTags(job.result.tags)
            }
          }
          break
        } else if (jobStatus === 'failed') {
          throw new Error(job.error || 'AI Generation Failed')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI suggestions')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  useEffect(() => {
    fetchArtwork()
  }, [params.id])

  const fetchArtwork = async () => {
    try {
      const data = await fetchApi(`/artworks/${params.id}`)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setMedium(data.medium || '')
      setStyle(data.style || '')
      setDimensions(data.dimensions || '')
      setPrice(data.price?.toString() || '')
      if (Array.isArray(data.tags)) setTags(data.tags.map((t: any) => t.name || t))
      setIsSold(data.status === 'sold')
      
      if (data.status === 'sold') {
        setError('Sold artworks cannot be modified.')
        setStatus('error')
        return
      }
      
      setStatus('idle')
    } catch (err: any) {
      setError('Failed to load artwork details')
      setStatus('error')
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setStatus('saving')
    setError('')

    try {
      await fetchApi(`/artworks/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: description || undefined,
          medium: medium || undefined,
          style: style || undefined,
          dimensions: dimensions || undefined,
          price: price ? parseFloat(price) : undefined,
        }),
      })

      setStatus('success')
      setTimeout(() => {
        router.push(`/artworks/${params.id}`)
      }, 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Update failed. Please try again.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 pt-24">
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Success Overlay */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
            >
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center max-w-sm">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Changes Saved</h2>
                <p className="text-slate-400 text-sm">Your artwork listing has been updated.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white">Edit Masterpiece</h1>
              <p className="text-slate-400">Update the details of your listed artwork</p>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-12">
           {/* Left Sidebar / Info */}
           <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-sm mb-2 text-white">Curator Tip</h3>
                 <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                   High-quality descriptions and accurate pricing increase the chances of acquisition by collectors.
                 </p>
                 <button
                   disabled={isGeneratingAI || isSold}
                   onClick={generateAISuggestions}
                   className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 text-sm"
                 >
                   {isGeneratingAI ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                   ) : (
                     <><Bot className="w-4 h-4" /> Autofill with AI</>
                   )}
                 </button>
              </div>
           </div>

           {/* Main Form */}
           <div className="md:col-span-2 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-sm text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Artwork Title</label>
                  <input
                    disabled={isSold}
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price (GBP £)</label>
                    <div className="relative">
                      <PoundSterling className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        disabled={isSold}
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medium</label>
                    <div className="relative">
                      <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        disabled={isSold}
                        type="text"
                        value={medium}
                        onChange={e => setMedium(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                  <textarea
                    disabled={isSold}
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Style</label>
                    <input
                      disabled={isSold}
                      type="text"
                      value={style}
                      onChange={e => setStyle(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dimensions</label>
                    <input
                      disabled={isSold}
                      type="text"
                      value={dimensions}
                      onChange={e => setDimensions(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Tag className="w-3 h-3" />Tags</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl min-h-[52px]">
                    {tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 bg-indigo-500/15 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/20">
                        #{tag}
                        {!isSold && (
                          <button onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="text-indigo-400/60 hover:text-rose-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {!isSold && (
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
                        placeholder={tags.length === 0 ? 'Add tags (press Enter or ,)' : '+ add more...'}
                        className="flex-1 min-w-[120px] bg-transparent text-white text-xs outline-none placeholder:text-slate-600"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                 <button
                   onClick={() => router.back()}
                   className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                 >
                   Discard
                 </button>
                 <button
                   disabled={status === 'saving' || isSold}
                   onClick={handleSubmit}
                   className="flex-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                 >
                   {status === 'saving' ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <>
                        <Send className="w-4 h-4" />
                        Save Changes
                     </>
                   )}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
