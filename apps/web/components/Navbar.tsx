'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, User, Settings as SettingsIcon, LogOut, 
  Menu, X, Sparkles, MessageSquare, Bell, ShoppingBag,
  Package, Upload, Heart, CheckCircle
} from 'lucide-react'


export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [polling, setPolling] = useState(false)

  const fetchNotifications = async () => {
    try {
      const data = await fetchApi('/notifications?unread_only=true')
      setNotifications(data.notifications || [])
    } catch (e) {
      // Ignore errors for polling
    }
  }

  const markNotifRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) {}
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [supabase])

  useEffect(() => {
    if (session && !polling) {
      fetchNotifications()
      setPolling(true)
      const interval = setInterval(fetchNotifications, 10000)
      return () => clearInterval(interval)
    }
  }, [session, polling])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const role = session?.user?.app_metadata?.role as 'artist' | 'buyer' | undefined

  const navLinks = [
    { name: 'Discover', href: '/', icon: Sparkles, show: role === 'buyer' },
    { name: 'Studio', href: '/artist/dashboard', icon: Palette, show: role === 'artist' },
    { name: 'Upload New', href: '/artist/upload', icon: Upload, show: role === 'artist' },
    { name: 'Favorites', href: '/buyer/favorites', icon: Heart, show: role === 'buyer' },
    { name: 'Purchases', href: '/buyer/purchases', icon: ShoppingBag, show: role === 'buyer' },
    { name: 'Marketplace', href: '/artworks', icon: ShoppingBag, show: !role || role === 'buyer' },
  ].filter(link => link.show)


  // Don't show navbar on login/register/onboard
  const hideNav = ['/login', '/register', '/onboard'].includes(pathname)
  if (hideNav) return null

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">ArtMarket</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === link.href ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {session && (
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-400 hover:text-white transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 backdrop-blur-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm">Notifications</h3>
                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                        ) : (
                          notifications.map((n: any) => (
                            <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group relative cursor-pointer" onClick={(e) => markNotifRead(n.id, e)}>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-slate-200 text-sm font-bold truncate pr-6">{n.title}</h4>
                                <button className="absolute top-4 right-4 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-slate-400 text-xs line-clamp-2">{n.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {session ? (
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {session.user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">{session.user.email.split('@')[0]}</span>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setProfileDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-20 backdrop-blur-xl"
                    >
                      <Link 
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="h-px bg-white/5 my-2" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/10 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-slate-300 hover:text-white"
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
