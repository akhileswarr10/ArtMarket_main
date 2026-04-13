'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldAlert, Users, Package, AlertTriangle,
  LogOut, LayoutDashboard, Settings, Search,
  CheckCircle2, XCircle, ChevronRight, BarChart3,
  ShieldCheck
} from 'lucide-react'

export default function AdminDashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchApi('/admin/stats'),
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const statCards = [
    { label: 'Total Curators', value: stats?.total_users || 0, icon: Users, color: 'indigo' },
    { label: 'Galleries Managed', value: stats?.total_artworks || 0, icon: Package, color: 'emerald' },
    { label: 'Pending Review', value: stats?.pending_artworks || 0, icon: AlertTriangle, color: 'amber' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-7xl mx-auto p-8">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-white">Control Center</h1>
            <p className="text-slate-500 text-sm mt-1">Platform-wide statistics and management</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
             <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 text-xs font-bold uppercase tracking-widest">
                System Online
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/8 transition-colors"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                 <p className="text-5xl font-black text-white tracking-tighter">{isLoading ? '—' : value}</p>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action area */}
        <div className="grid grid-cols-2 gap-6">
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <Users className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">User Base</h3>
                    <p className="text-slate-500 text-sm">Recently active curators</p>
                 </div>
              </div>
              <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/3 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800" />
                          <div>
                             <p className="text-sm font-bold text-white">Collector_{i}</p>
                             <p className="text-[10px] text-slate-500">Joined 2 days ago</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-700" />
                    </div>
                 ))}
                 <button className="w-full py-3 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                    Manage All Curators →
                 </button>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <BarChart3 className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">Platform Health</h3>
                    <p className="text-slate-500 text-sm">System performance metrics</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                       <span>Database Load</span>
                       <span className="text-emerald-500">Optimal</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-[24%] bg-emerald-500" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                       <span>Storage Usage</span>
                       <span>64%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-[64%] bg-indigo-500" />
                    </div>
                 </div>
                 <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       All systems operational
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}