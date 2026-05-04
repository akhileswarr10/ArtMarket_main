import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RegisterForm from './RegisterForm'
import { Palette, Sparkles, UserPlus } from 'lucide-react'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-canvas-950 flex items-center justify-center p-6 text-ink relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-gold-600 to-copper blur-[120px] rounded-full mix-blend-screen mix-blend-lighten" />
      </div>

      <div className="w-full max-w-[520px] animate-fade-in relative z-10">
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

        {/* Register Card */}
        <div className="bg-surface/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-border overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <div className="badge-gold mb-4">
                <UserPlus className="w-3 h-3" />
                Artist Registration
              </div>
              <h1 className="font-display text-4xl font-bold text-ink">Create Account</h1>
              <p className="text-ink-secondary font-medium mt-2">Join the elite circle of digital visionaries</p>
            </div>

            <RegisterForm />

            <div className="mt-10 text-center">
              <p className="text-sm font-bold text-ink-secondary uppercase tracking-widest">
                Already a member?{' '}
                <Link href="/login" className="text-gold-400 hover:text-gold-300 ml-1 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer/Terms */}
        <p className="mt-8 text-center text-xs font-semibold text-ink-muted uppercase tracking-widest leading-loose max-w-sm mx-auto">
          By joining, you agree to our <a href="#" className="underline hover:text-ink transition-colors">Terms</a> & <a href="#" className="underline hover:text-ink transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
