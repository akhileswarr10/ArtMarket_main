'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Palette, ShoppingBag, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '') + '/api'

export default function OnboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'buyer' | 'artist'>('buyer')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'role' | 'details'>('role')

  // Prevent re-onboarding if already done
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      // Check if already onboarded
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const user = await res.json()
        if (user.role) {
          // Refresh session to get the new role in app_metadata before redirecting
          await supabase.auth.refreshSession()
          router.push('/dashboard')
        }
      }

    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`${API_URL}/users/me/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role,
          display_name: displayName,
          bio: bio || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Onboarding failed' }))
        throw new Error(data.detail || 'Onboarding failed')
      }

      // Force token refresh so app_metadata.role propagates
      await supabase.auth.refreshSession()

      if (role === 'artist') {
        router.push('/artist/dashboard')
      } else {
        router.push('/buyer/dashboard')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-canvas-950 via-slate-900 to-gold-950 flex items-center justify-center p-6">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-muted rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-muted rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-surface/60 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="badge-emerald mb-5"
              >
                <Sparkles className="w-3 h-3" />
                Final Step
              </motion.div>
              <h1 className="font-display text-4xl font-bold text-ink mb-2">Complete your profile</h1>
              <p className="text-ink-secondary">Join ArtMarket as an artist or a collector</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest block">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'buyer', icon: ShoppingBag, label: 'Collect Art', sub: 'Browse & buy', color: 'emerald' },
                    { value: 'artist', icon: Palette, label: 'Sell Art', sub: 'Upload & earn', color: 'indigo' },
                  ].map(({ value, icon: Icon, label, sub, color }) => {
                    const isActive = role === value
                    return (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole(value as 'buyer' | 'artist')}
                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 text-center ${
                          isActive
                            ? color === 'emerald'
                              ? 'bg-emerald-muted border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                              : 'bg-gold-muted border-gold/50 shadow-lg shadow-gold-500/10'
                            : 'bg-surface/40 border-border hover:border-border-strong'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isActive
                            ? color === 'emerald' ? 'bg-emerald text-ink' : 'bg-gold-500 text-ink'
                            : 'bg-surface/60 text-ink-secondary'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isActive ? 'text-ink' : 'text-ink-secondary'}`}>{label}</p>
                          <p className="text-xs text-ink-secondary">{sub}</p>
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="role-check"
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle className={`w-4 h-4 ${color === 'emerald' ? 'text-emerald' : 'text-gold-400'}`} />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={role === 'artist' ? 'e.g. Alex Rivera (for your artist page)' : 'e.g. Alex Rivera'}
                  required
                  className="input-galerie w-full"
                />
              </div>

              {/* Bio (artist only) */}
              <AnimatePresence>
                {role === 'artist' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                      Bio <span className="text-ink-secondary normal-case font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell collectors about your work and inspiration..."
                      rows={3}
                      className="input-galerie w-full resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 group ${
                  role === 'artist'
                    ? 'bg-gold-500 hover:bg-gold-500 text-ink shadow-gold-500/25 disabled:bg-gold-600'
                    : 'bg-emerald-500 hover:bg-emerald text-ink shadow-emerald-500/25 disabled:bg-emerald-800'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Enter ArtMarket
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
