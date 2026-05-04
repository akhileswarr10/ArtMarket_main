import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LoginForm from './LoginForm'
import { Sparkles, Palette } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-canvas-950 flex items-center justify-center p-6 text-ink relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold-600 to-copper blur-[120px] rounded-full mix-blend-screen mix-blend-lighten" />
      </div>

      <div className="w-full max-w-[480px] animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-600 to-copper rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-xl shadow-gold-sm">
              <Palette className="w-6 h-6 text-ink" />
            </div>
            <span className="font-display text-4xl font-bold tracking-tight text-ink">
              ArtMarket
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border-subtle rounded-3xl shadow-card overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <div className="badge-gold mb-4">
                <Sparkles className="w-3 h-3" />
                Secure Access
              </div>
              <h1 className="font-display text-4xl font-bold text-ink">Welcome Back</h1>
              <p className="text-ink-secondary font-medium mt-2">Enter your credentials to access your gallery</p>
            </div>

            <LoginForm />

            <div className="mt-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-surface text-ink-muted font-bold uppercase tracking-widest rounded-full">or</span>
                </div>
              </div>

              <Link href="/register" className="btn-ghost w-full">
                Create new account
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-surface/60 backdrop-blur-md rounded-3xl shadow-xl border border-border">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-2 bg-emerald rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Demo Experience</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-ink-secondary uppercase mb-1 tracking-widest">Email</p>
              <p className="text-sm text-ink font-mono bg-surface/60 px-2 py-1 rounded-md inline-block">demo@artmarket.com</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink-secondary uppercase mb-1 tracking-widest">Password</p>
              <p className="text-sm text-ink font-mono bg-surface/60 px-2 py-1 rounded-md inline-block">demopassword</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
