'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'

export default function RegisterForm() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/register/complete')
  }

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-muted border border-rose-100 rounded-2xl flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest ml-1">Email Address</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Mail className="w-5 h-5 text-ink-muted group-focus-within:text-gold-500 transition-colors" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-galerie w-full pl-12"
            placeholder="name@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted uppercase tracking-widest ml-1">Secure Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-ink-muted group-focus-within:text-gold-500 transition-colors" />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-galerie w-full pl-12"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <div className="flex items-center gap-2 ml-1">
          <ShieldCheck className="w-3 h-3 text-emerald" />
          <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Min. 6 characters</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            Creating Profile...
          </>
        ) : (
          <>
            Create Artist Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}
