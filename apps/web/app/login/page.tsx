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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-600 blur-[120px] rounded-full mix-blend-screen mix-blend-lighten" />
      </div>

      <div className="w-full max-w-[480px] animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-xl shadow-indigo-500/20">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight text-white">
              ArtMarket
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4 border border-indigo-500/20">
                <Sparkles className="w-3 h-3" />
                Secure Access
              </div>
              <h1 className="text-3xl font-black text-white">Welcome Back</h1>
              <p className="text-slate-400 font-medium mt-2">Enter your credentials to access your gallery</p>
            </div>

            <LoginForm />

            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#0a0f1c] text-slate-500 font-bold uppercase tracking-widest rounded-full">or continue with</span>
                </div>
              </div>

              <Link href="/register" className="mt-10 w-full flex items-center justify-center py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300">
                Create new account
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-white/5 backdrop-blur-md rounded-3xl shadow-xl border border-white/10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Demo Experience</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Email</p>
              <p className="text-sm text-white font-mono bg-white/5 px-2 py-1 rounded-md inline-block">demo@artmarket.com</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Password</p>
              <p className="text-sm text-white font-mono bg-white/5 px-2 py-1 rounded-md inline-block">demopassword</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
