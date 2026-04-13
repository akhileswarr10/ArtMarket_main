import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LoginForm from './LoginForm'
import { Sparkles } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 grain">
      <div className="w-full max-w-[480px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-xl shadow-slate-200">
              <span className="text-white text-2xl font-bold font-heading">A</span>
            </div>
            <span className="text-3xl font-black font-heading tracking-tight text-slate-900">
              ArtMarket
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3 h-3" />
                Secure Access
              </div>
              <h1 className="text-3xl font-black font-heading text-slate-900">Welcome Back</h1>
              <p className="text-slate-400 font-medium mt-2">Enter your credentials to access your gallery</p>
            </div>

            <LoginForm />

            <div className="mt-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">or continue with</span>
                </div>
              </div>

              <Link href="/register" className="mt-10 w-full flex items-center justify-center py-4 px-6 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold hover:bg-slate-100 hover:border-slate-200 transition-all duration-300">
                Create new account
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Demo Experience</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email</p>
              <p className="text-sm text-white font-mono">demo@artmarket.com</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Password</p>
              <p className="text-sm text-white font-mono">demopassword</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
