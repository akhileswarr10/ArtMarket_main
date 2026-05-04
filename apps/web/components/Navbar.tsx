'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, User, Settings as SettingsIcon, LogOut, 
  Menu, X, Sparkles, ShoppingBag, Upload, Heart
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import CartIcon from './CartIcon'
import { useCartStore } from '@/lib/stores/cartStore'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const { setCart, clearCart } = useCartStore()
  // Track which user's cart is currently loaded to detect user switches
  const cartUserIdRef = useRef<string | null>(null)

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
    if (session?.user) {
      const userId = session.user.id
      // Re-fetch cart whenever a different user logs in
      if (cartUserIdRef.current !== userId) {
        cartUserIdRef.current = userId
        import('@/lib/api/client').then(({ getCart }) => {
          getCart().then(setCart).catch(console.error)
        })
      }
    } else {
      // Session gone (logged out) — clear the cart
      if (cartUserIdRef.current !== null) {
        cartUserIdRef.current = null
        clearCart()
      }
    }
  }, [session, setCart, clearCart])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    cartUserIdRef.current = null
    clearCart()
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

  const hideNav = ['/login', '/register', '/onboard'].includes(pathname)
  if (hideNav) return null

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-canvas-950/80 backdrop-blur-xl border-b border-border py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-600 to-copper flex items-center justify-center shadow-lg shadow-gold-sm group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5 text-ink" />
          </div>
          <span className="font-bold text-xl tracking-tight text-ink">ArtMarket</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                pathname === link.href ? 'text-gold-400' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {session && role !== 'artist' && <CartIcon />}
          {session && <NotificationBell userId={session.user.id} />}
          
          {session ? (
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full bg-surface/60 border border-border hover:bg-surface-raised/70 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-copper flex items-center justify-center text-xs font-bold text-ink">
                  {session.user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">{session.user.email.split('@')[0]}</span>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-surface border border-border rounded-2xl shadow-2xl p-2 z-20 backdrop-blur-xl"
                    >
                      <Link 
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:bg-surface/60 hover:text-ink transition-all"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:bg-surface/60 hover:text-ink transition-all"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="h-px bg-surface/60 my-2" />
                      <button 
                        onClick={handleLogout}
                        className="btn-gold w-full"
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
              className="btn-gold"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-ink"
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
            className="md:hidden bg-surface border-b border-border overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-ink-muted hover:text-ink"
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
