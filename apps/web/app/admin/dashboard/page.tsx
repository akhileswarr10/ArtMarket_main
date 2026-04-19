'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Package, AlertTriangle, Search,
  CheckCircle2, XCircle, ChevronRight, BarChart3,
  ShieldCheck, ShoppingCart, LayoutGrid, Activity,
  Ban, ShieldAlert, Loader2, RefreshCw, LogOut, Settings, Key, Lock, Eye, EyeOff,
  ChevronDown, UserCog, Copy, Check, X
} from 'lucide-react'

// --- Sub-components for Views ---

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/8 transition-colors"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
        color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
        color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
        'bg-violet-500/10 text-violet-400'
      }`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-4xl font-black text-white tracking-tighter">
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : value}
        </p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{label}</p>
      </div>
    </motion.div>
  )
}

function SectionHeading({ title, subtitle, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-6 mb-12">
      <div className={`p-4 ${color} rounded-[1.5rem] shadow-lg shadow-indigo-500/20`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-1">{title}</h2>
        <p className="text-slate-500 font-medium text-sm tracking-wide">{subtitle}</p>
      </div>
    </div>
  )
}

const RoleSelector = ({ currentRole, onSelect }: { currentRole: string, onSelect: (role: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const roles = [
    { value: 'buyer', label: 'Buyer', color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { value: 'artist', label: 'Artist', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { value: 'admin', label: 'Admin', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ]

  const active = roles.find(r => r.value === currentRole) || roles[0]

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < 250)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left">
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-all min-w-[130px] justify-between group"
      >
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${active.bg.replace('/10', '')} shadow-[0_0_8px] shadow-current`} />
           <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-100">{active.label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: openUp ? -8 : 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUp ? -8 : 8, scale: 0.95 }}
              className={`absolute right-0 ${openUp ? 'bottom-full mb-3' : 'top-full mt-3'} w-48 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 z-50 shadow-[0_20px_50px_rgba(0,0,0,1)]`}
              style={{ originY: openUp ? 1 : 0 }}
            >
              <div className="px-3 py-2 border-b border-white/5 mb-2">
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Select Role</p>
              </div>
              {roles.map(role => (
                <button
                  key={role.value}
                  onClick={() => {
                    onSelect(role.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[1.5rem] transition-all hover:bg-white/5 group ${currentRole === role.value ? 'bg-white/5' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full ${role.bg.replace('/10', '')} ${currentRole === role.value ? 'scale-125' : 'scale-100 opacity-40 group-hover:opacity-100'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentRole === role.value ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {role.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Settings States
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [password, setPassword] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState<{userId: string, role: string} | null>(null)
  const [pormotionSecretKey, setPromotionSecretKey] = useState('')
  const [viewingArtworkId, setViewingArtworkId] = useState<string | null>(null)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchApi('/admin/stats'),
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchApi('/admin/users'),
    enabled: activeTab === 'users'
  })

  const { data: artworksData, isLoading: artworksLoading } = useQuery({
    queryKey: ['admin-artworks'],
    queryFn: () => fetchApi('/admin/artworks'),
    enabled: activeTab === 'artworks'
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetchApi('/admin/orders'),
    enabled: activeTab === 'orders'
  })

  const { data: artworkDetail, isLoading: artworkDetailLoading } = useQuery({
    queryKey: ['artwork-detail', viewingArtworkId],
    queryFn: () => fetchApi(`/artworks/${viewingArtworkId}`),
    enabled: !!viewingArtworkId
  })

  const updateRole = useMutation({
    mutationFn: ({ userId, role, secretKey }: any) => {
      let url = `/admin/users/${userId}/role?role=${role}`
      if (secretKey) url += `&secret_key=${secretKey}`
      return fetchApi(url, { method: 'PATCH' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowPromotionModal(null)
      setPromotionSecretKey('')
    },
    onError: (err: any) => {
        alert(err.message || "Operation failed")
    }
  })

  const toggleStatus = useMutation({
    mutationFn: ({ userId, active }: any) => fetchApi(`/admin/users/${userId}/status?is_active=${active}`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  })

  const moderateArtwork = useMutation({
    mutationFn: ({ id, status }: any) => fetchApi(`/admin/artworks/${id}/status?status=${status}`, { method: 'PATCH' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-artworks'] })
      queryClient.invalidateQueries({ queryKey: ['artwork-detail', variables.id] })
    }
  })

  const navigation = [
    { id: 'overview', name: 'Overview', icon: LayoutGrid },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'artworks', name: 'Artworks', icon: Package },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'verification', name: 'Verification', icon: ShieldCheck },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  const { data: verificationQueue, isLoading: verificationLoading } = useQuery({
    queryKey: ['admin-verification-queue'],
    queryFn: () => fetchApi('/verification/queue'),
    enabled: activeTab === 'verification'
  })

  const approveVerification = useMutation({
    mutationFn: (artistId: string) => fetchApi(`/verification/${artistId}/approve`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    }
  })

  const rejectVerification = useMutation({
    mutationFn: ({ artistId, reason }: { artistId: string, reason: string }) => 
      fetchApi(`/verification/${artistId}/reject`, { 
        method: 'PATCH',
        body: JSON.stringify({ reason })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleVerifyPassword = async () => {
    setIsVerifying(true)
    try {
      await fetchApi('/admin/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
      const { key } = await fetchApi('/admin/settings/secret-key')
      setRevealedKey(key)
      setShowKeyModal(false)
      setPassword('')
    } catch (err: any) {
      alert("Invalid password or verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const updateSecretKeyMutation = useMutation({
    mutationFn: (newKey: string) => fetchApi('/admin/settings/secret-key', {
        method: 'POST',
        body: JSON.stringify({ new_key: newKey })
    }),
    onSuccess: () => {
        alert("Secret Key updated successfully")
        setRevealedKey(null)
    }
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl flex flex-col p-6 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold text-sm tracking-wide">{item.name}</span>
                {isActive && (
                  <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-4 mt-auto rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-bold text-sm">System Exit</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 min-h-screen">
        <header className="flex items-center justify-between mb-12">
           <div>
              <h2 className="text-4xl font-black text-white tracking-tight">
                {navigation.find(n => n.id === activeTab)?.name} Center
              </h2>
              <p className="text-slate-500 font-medium mt-1">Platform-wide oversight and data management</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Sync Alpha</span>
              </div>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Users" value={stats?.total_users} icon={Users} color="indigo" loading={statsLoading} />
                <StatCard label="Live Artworks" value={stats?.total_artworks} icon={Package} color="emerald" loading={statsLoading} />
                <StatCard label="Rev. To Date" value={`$${(stats?.total_revenue || 0).toLocaleString()}`} icon={BarChart3} color="violet" loading={statsLoading} />
                <div onClick={() => setActiveTab('verification')} className="cursor-pointer">
                  <StatCard label="Pending Review" value={stats?.pending_artworks} icon={AlertTriangle} color="amber" loading={statsLoading} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                    <SectionHeading title="System Health" subtitle="Global performance metrics" icon={Activity} color="bg-indigo-500" />
                    <div className="space-y-6">
                       <div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                             <span>Database Throughput</span>
                             <span className="text-emerald-500">Perfect</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '24%' }} className="h-full bg-emerald-500" />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                             <span>Object Storage</span>
                             <span>64% capacity</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '64%' }} className="h-full bg-indigo-500" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                    <SectionHeading title="Platform Alerts" subtitle="Recent security and traffic notes" icon={ShieldAlert} color="bg-amber-500" />
                    <div className="space-y-4">
                       {[
                         { msg: 'System backup completed successfully', time: '2h ago', status: 'ok' },
                         { msg: 'New curator registration pending', time: '5h ago', status: 'alert' },
                         { msg: 'Standard API maintenance scheduled', time: '1d ago', status: 'info' },
                       ].map((alert, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/3 rounded-2xl border border-white/5">
                             <span className="text-sm font-medium text-slate-300">{alert.msg}</span>
                             <span className="text-[10px] text-slate-500 font-bold">{alert.time}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-visible min-h-[550px]"
            >
              <div className="p-8 border-b border-white/5">
                 <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                 </div>
              </div>
              <div className="overflow-visible min-h-[500px]">
                 <table className="w-full text-left">
                    <thead className="bg-white/1 px-8">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {usersLoading ? (
                         <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                       ) : users?.map((u: any) => (
                         <tr key={u.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-8 py-5">
                               <p className="font-bold text-white text-sm">{u.email}</p>
                               <p className="text-[10px] text-slate-500 font-medium">UID: {u.id.substring(0,8)}...</p>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                 u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 
                                 u.role === 'artist' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                               }`}>
                                 {u.role || 'unassigned'}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  <span className="text-xs font-bold text-slate-400">{u.is_active ? 'Active' : 'Suspended'}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right space-x-3 flex items-center justify-end">
                               <RoleSelector 
                                 currentRole={u.role}
                                 onSelect={(newRole) => {
                                   if (newRole === 'admin') {
                                     setShowPromotionModal({ userId: u.id, role: newRole })
                                   } else {
                                     updateRole.mutate({ userId: u.id, role: newRole })
                                   }
                                 }}
                               />
                               <button 
                                 onClick={() => toggleStatus.mutate({ userId: u.id, active: !u.is_active })}
                                 className={`p-2 rounded-xl transition-all border ${
                                   u.is_active ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                 }`}
                                 title={u.is_active ? 'Suspend User' : 'Reinstate User'}
                               >
                                  {u.is_active ? <Ban className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'artworks' && (
            <motion.div
              key="artworks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-visible min-h-[550px]"
            >
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/1 px-8">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Artwork</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Creator</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Moderation</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {artworksLoading ? (
                         <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                       ) : artworksData?.artworks.map((a: any) => (
                         <tr key={a.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-8 py-5">
                               <p className="font-bold text-white text-sm">{a.title}</p>
                               <p className="text-[10px] text-slate-500 font-medium">ID: {a.id.substring(0,8)}</p>
                            </td>
                            <td className="px-8 py-5">
                               <p className="text-xs font-bold text-indigo-400">{a.artist}</p>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                 a.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 
                                 a.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'
                               }`}>
                                 {a.status}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right space-x-2">
                               <button 
                                 onClick={() => setViewingArtworkId(a.id)}
                                 className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 border border-indigo-500/10 transition-all"
                                 title="Inspect Artwork"
                               >
                                  <Eye className="w-4 h-4" />
                               </button>
                               {a.status !== 'rejected' && (
                                 <button 
                                   onClick={() => moderateArtwork.mutate({ id: a.id, status: 'rejected' })}
                                   className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 border border-red-500/10 transition-all"
                                 >
                                    <XCircle className="w-4 h-4" />
                                 </button>
                               )}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-visible min-h-[550px]"
            >
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/1 px-8">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {ordersLoading ? (
                         <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                       ) : ordersData?.orders.length === 0 ? (
                         <tr><td colSpan={4} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">No transaction records found</td></tr>
                       ) : ordersData?.orders.map((o: any) => (
                         <tr key={o.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-8 py-5">
                               <p className="font-bold text-white text-sm tracking-tight">#{o.id.substring(0,8).toUpperCase()}</p>
                            </td>
                            <td className="px-8 py-5">
                               <p className="text-sm font-black text-white">${o.total_amount.toLocaleString()}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{o.currency}</p>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                 o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 
                                 o.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                               }`}>
                                 {o.status}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                               <p className="text-xs text-slate-400 font-bold">{new Date(o.created_at).toLocaleDateString()}</p>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}
          {activeTab === 'verification' && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-visible min-h-[550px]"
            >
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/1 px-8">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Artist</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {verificationLoading ? (
                         <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                       ) : verificationQueue?.length === 0 ? (
                         <tr><td colSpan={3} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">No pending applications</td></tr>
                       ) : verificationQueue?.map((v: any) => (
                         <tr key={v.artist_id} className="hover:bg-white/2 transition-colors">
                            <td className="px-8 py-5">
                               <p className="font-bold text-white text-sm">{v.display_name}</p>
                               <p className="text-[10px] text-slate-500 font-medium">ID: {v.artist_id.substring(0,8)}</p>
                            </td>
                            <td className="px-8 py-5">
                               <p className="text-xs text-slate-400 font-bold">{v.verification_submitted_at ? new Date(v.verification_submitted_at).toLocaleDateString() : 'N/A'}</p>
                            </td>
                            <td className="px-8 py-5 text-right space-x-2">
                               <button 
                                 onClick={() => approveVerification.mutate(v.artist_id)}
                                 className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/10 transition-all text-xs font-black uppercase tracking-widest"
                               >
                                  Approve
                               </button>
                               <button 
                                 onClick={() => {
                                   const reason = prompt('Reason for rejection?');
                                   if (reason) rejectVerification.mutate({ artistId: v.artist_id, reason });
                                 }}
                                 className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 border border-red-500/10 transition-all text-xs font-black uppercase tracking-widest"
                               >
                                  Reject
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl"
            >
               <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                  <SectionHeading title="System Configuration" subtitle="High-security platform parameters" icon={ShieldAlert} color="bg-red-500" />
                  
                  <div className="space-y-8 mt-10">
                     <div className="p-8 bg-white/3 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Lock className="w-12 h-12" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Admin Secret Key</h4>
                        
                        {revealedKey ? (
                           <div className="space-y-4">
                              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/10">
                                 <Key className="w-5 h-5 text-indigo-400" />
                                 <input 
                                   type="text" 
                                   value={revealedKey} 
                                   onChange={(e) => setRevealedKey(e.target.value)}
                                   className="bg-transparent border-none focus:ring-0 text-white font-mono text-lg flex-1"
                                 />
                                 <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(revealedKey)
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 2000)
                                      }}
                                      className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                                      title="Copy Secret Key"
                                    >
                                       {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => setRevealedKey(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                                       <EyeOff className="w-5 h-5" />
                                    </button>
                                 </div>
                              </div>
                              <button 
                                onClick={() => updateSecretKeyMutation.mutate(revealedKey)}
                                disabled={updateSecretKeyMutation.isPending}
                                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                              >
                                 {updateSecretKeyMutation.isPending ? 'Syncing...' : 'Update Global Secret'}
                              </button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-6">
                              <div className="flex-1 flex gap-2">
                                 {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-2 h-2 bg-slate-700 rounded-full" />)}
                              </div>
                              <button 
                                onClick={() => setShowKeyModal(true)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                              >
                                 Reveal Secure Key
                              </button>
                           </div>
                        )}
                        
                        <p className="mt-6 text-[10px] text-slate-500 leading-relaxed font-medium">
                           This key is required by the system to authorize any administrative role promotions. Keep it safe and never share it via insecure channels.
                        </p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Modals --- */}
        <AnimatePresence>
           {showKeyModal && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
              >
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
                 >
                    <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-6">
                       <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Identify Required</h3>
                    <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">Please enter your account password to view the platform secret key.</p>
                    
                    <input 
                      type="password" 
                      placeholder="Admin Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white mb-6 focus:outline-none focus:border-red-500/50"
                    />
                    
                    <div className="flex gap-4">
                       <button onClick={() => setShowKeyModal(false)} className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[10px]">Cancel</button>
                       <button 
                         onClick={handleVerifyPassword}
                         disabled={isVerifying}
                         className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 transition-all flex items-center justify-center"
                       >
                          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                       </button>
                    </div>
                 </motion.div>
              </motion.div>
           )}

           
            {viewingArtworkId && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-6 md:p-12"
               >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                  >
                     <div className="flex items-center justify-between p-8 border-b border-white/5">
                        <div className="flex items-center gap-4 text-left font-sans">
                           <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                              <Package className="w-6 h-6 text-white" />
                           </div>
                           <div className="text-left">
                              <h3 className="text-2xl font-black text-white leading-none mb-1 text-left">Artwork Inspection</h3>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-left">Moderation ID: {viewingArtworkId}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setViewingArtworkId(null)}
                          className="p-4 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                        >
                           <X className="w-6 h-6" />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8 md:p-12 text-left font-sans">
                        {artworkDetailLoading ? (
                           <div className="h-96 flex flex-col items-center justify-center gap-4 text-left">
                              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                              <p className="text-slate-500 font-black uppercase tracking-widest text-xs text-left">Retrieving high-res assets...</p>
                           </div>
                        ) : artworkDetail ? (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 text-left">
                              <div className="space-y-6 text-left">
                                 <div className="aspect-square bg-white/3 rounded-[2.5rem] overflow-hidden border border-white/10 group relative text-left shadow-2xl">
                                    <img 
                                      src={artworkDetail.images?.[0]?.signed_url || '/placeholder-artwork.jpg'} 
                                      alt={artworkDetail.title}
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-6 left-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full text-left">
                                       <p className="text-[10px] font-black uppercase tracking-widest text-white text-left font-bold">{artworkDetail.images?.length || 0} Images</p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-4 gap-4 text-left">
                                    {artworkDetail.images?.slice(1, 5).map((img, i) => (
                                       <div key={i} className="aspect-square bg-white/3 rounded-2xl overflow-hidden border border-white/5 opacity-60 hover:opacity-100 transition-opacity text-left cursor-zoom-in">
                                          <img src={img.signed_url} alt="" className="w-full h-full object-cover" />
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              <div className="flex flex-col h-full text-left">
                                 <div className="mb-10 text-left">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 text-left">Core Details</h4>
                                    <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight text-left">{artworkDetail.title}</h2>
                                    <p className="text-slate-400 text-lg leading-relaxed font-medium text-left">
                                       {artworkDetail.description || "No description provided."}
                                    </p>
                                 </div>

                                 <div className="grid grid-cols-2 gap-6 mb-12 text-left">
                                    <div className="p-6 bg-white/3 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors text-left">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Pricing</p>
                                       <p className="text-2xl font-black text-white tracking-tighter text-left">${artworkDetail.price?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="p-6 bg-white/3 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors text-left">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Status</p>
                                       <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-left ${
                                          artworkDetail.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 
                                          artworkDetail.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'
                                       }`}>
                                          {artworkDetail.status}
                                       </span>
                                    </div>
                                    <div className="p-6 bg-white/3 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors text-left">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Category & Style</p>
                                       <p className="text-sm font-bold text-slate-300 text-left">{artworkDetail.medium} • {artworkDetail.style}</p>
                                    </div>
                                    <div className="p-6 bg-white/3 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors text-left">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Dimensions</p>
                                       <p className="text-sm font-bold text-slate-300 text-left">{artworkDetail.dimensions || "N/A"}</p>
                                    </div>
                                 </div>

                                 <div className="mt-auto pt-8 border-t border-white/5 text-left">
                                    {artworkDetail.buyer && (
                                       <div className="mb-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                                          <div className="flex items-center gap-3 mb-4">
                                             <div className="p-2 bg-indigo-500 rounded-lg">
                                                <ShoppingCart className="w-4 h-4 text-white" />
                                             </div>
                                             <h4 className="text-xs font-black text-white uppercase tracking-widest">Sale Record</h4>
                                          </div>
                                          <div className="space-y-2">
                                             <p className="text-sm font-bold text-white">{artworkDetail.buyer.display_name}</p>
                                             <p className="text-xs text-indigo-400 font-medium">{artworkDetail.buyer.email}</p>
                                          </div>
                                       </div>
                                    )}
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Administrative Control</h4>
                                    <div className="flex gap-4">
                                       <button 
                                         onClick={() => {
                                             if(confirm("Are you sure you want to reject/unpublish this artwork?")) {
                                                 moderateArtwork.mutate({ id: viewingArtworkId, status: 'rejected' })
                                             }
                                         }}
                                         disabled={moderateArtwork.isPending}
                                         className="flex-1 py-5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-2xl font-black text-slate-400 hover:text-red-400 uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                       >
                                          <XCircle className="w-5 h-5" />
                                          {moderateArtwork.isPending ? "Syncing..." : "Reject Submission"}
                                       </button>
                                    </div>
                                    <p className="mt-6 text-[10px] text-slate-500 text-center font-medium opacity-60">Rejection will instantly unpublish the artwork and notify the artist.</p>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="h-96 flex items-center justify-center text-left">
                              <p className="text-slate-500 font-black uppercase tracking-widest text-xs text-left">Error loading artwork data.</p>
                           </div>
                        )}
                     </div>
                  </motion.div>
               </motion.div>
            )}
            {showPromotionModal && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
              >
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
                 >
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                       <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Security Verification</h3>
                    <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">Switching a user to <b>Admin</b> is a critical operation. Please enter the Admin Secret Key to authorize this change.</p>
                    
                    <input 
                      type="password" 
                      placeholder="Enter Admin Secret Key"
                      value={pormotionSecretKey}
                      onChange={(e) => setPromotionSecretKey(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white mb-6 focus:outline-none focus:border-amber-500/50"
                    />
                    
                    <div className="flex gap-4">
                       <button onClick={() => setShowPromotionModal(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[10px]">Back</button>
                       <button 
                         onClick={() => updateRole.mutate({ 
                           userId: showPromotionModal.userId, 
                           role: showPromotionModal.role,
                           secretKey: pormotionSecretKey
                         })}
                         disabled={updateRole.isPending}
                         className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all"
                       >
                          {updateRole.isPending ? 'Authorizing...' : 'Authorize Change'}
                       </button>
                    </div>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
      </main>
    </div>
  )
}