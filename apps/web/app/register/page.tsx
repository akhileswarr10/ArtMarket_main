import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RegisterForm from './RegisterForm'
import { Palette, Sparkles } from 'lucide-react'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 grain">
      <div className="w-full max-w-[520px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-11 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-xl shadow-slate-200">
              <span className="text-white text-2xl font-bold font-heading">A</span>
            </div>
            <span className="text-3xl font-black font-heading tracking-tight text-slate-900">
              ArtMarket
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Palette className="w-3 h-3" />
                Artist Registration
              </div>
              <h1 className="text-3xl font-black font-heading text-slate-900">Create Account</h1>
              <p className="text-slate-400 font-medium mt-2">Join the elite circle of digital visionaries</p>
            </div>

            <RegisterForm />

            <div className="mt-10 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Already a member?{' '}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 ml-1">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer/Terms */}
        <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">
          By joining, you agree to our <a href="#" className="underline hover:text-slate-600">Terms</a> & <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
