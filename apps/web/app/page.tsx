'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Zap, Search, LayoutGrid, Palette, Menu, X, Heart, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [session, setSession] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [supabase])

  const { scrollY } = useScroll()
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)'])
  const headerBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(16px)'])

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <div className="pt-20" />


      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={{
                animate: { transition: { staggerChildren: 0.1 } }
              }}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8">
                <Sparkles className="w-3 h-3" />
                AI-Powered Art Discovery
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-6xl lg:text-8xl font-black font-heading leading-[1.1] mb-8">
                <span className="gradient-text">Discover</span> the <br />Future of Art.
              </motion.h1>

              <motion.p variants={fadeIn} className="text-xl text-slate-500 leading-relaxed mb-12 max-w-lg">
                The premier marketplace where human creativity meets AI innovation. Discover unique pieces from the world's most visionary digital artists.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <Link href="/artworks" className="btn-premium group">
                  Explore Collection
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {!session && (
                  <Link href="/register" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-300">
                    Join as Artist
                  </Link>
                )}
              </motion.div>

              <motion.div variants={fadeIn} className="mt-20 flex gap-12 border-t border-slate-100 pt-12">
                {[
                  { label: 'Artists', value: '10K+' },
                  { label: 'Artworks', value: '50K+' },
                  { label: 'Volume', value: '$2.4M' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-black font-heading text-slate-900">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="relative aspect-[4/5] lg:aspect-square"
            >
              <div className="absolute inset-0 bg-emerald-100 rounded-[3rem] -rotate-6 scale-[1.02] shadow-2xl opacity-50"></div>
              <div className="relative h-full w-full rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white group">
                <Image 
                  src="/artwork-1.png" 
                  alt="Elite Artwork" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-10">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-1">Ethereal Currents</h3>
                    <p className="text-white/80 text-sm font-medium">By AI Visionary</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-5"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Auction</div>
                  <div className="text-lg font-black font-heading text-slate-900">4.58 ETH</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Marquee style or centered grid */}
      <section className="py-32 bg-slate-50 grain">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black font-heading mb-6 tracking-tight">The ArtMarket Experience</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">We're redefining how art is created, discovered, and collected using high-performance AI integration.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Palette className="w-8 h-8" />, 
                title: 'AI Smart Tagging', 
                desc: 'Our models automatically generate evocative titles and metadata for your creations.',
                color: 'bg-emerald-500'
              },
              { 
                icon: <LayoutGrid className="w-8 h-8" />, 
                title: 'Curated Galleries', 
                desc: 'Highly aesthetic collection displays optimized for desktop and mobile devices.',
                color: 'bg-indigo-500'
              },
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: 'Buyer Protection', 
                desc: 'Identity verification and secure transaction protocols for total peace of mind.',
                color: 'bg-rose-500'
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="premium-card"
              >
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-${f.color.split('-')[1]}-200`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black font-heading mb-6">Featured This Week</h2>
              <p className="text-slate-500 text-lg">Hand-picked selections from our AI-First artist community.</p>
            </div>
            <Link href="/artworks" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2].map((item) => (
              <motion.div 
                key={item}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-6 relative">
                  <Image 
                    src={item === 1 ? "/artwork-1.png" : "/artwork-2.png"}
                    alt="Featured Art" 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-5 right-5 flex gap-2">
                    <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-500 hover:text-white transition-all">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black font-heading hover:text-emerald-600 transition-colors cursor-pointer">
                      {item === 1 ? 'Ethereal Currents' : 'Regal Synthesis'}
                    </h3>
                    <div className="text-xl font-black text-slate-900">{0.5 * item + 0.2} ETH</div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    AI Pioneer
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Call to Action Card in the grid */}
            <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-emerald-200">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black font-heading mb-4">Start your collection today.</h3>
                <p className="text-emerald-50/80 mb-8 font-medium">Own a piece of the future with verified ownership and authenticity.</p>
                <Link href="/register" className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black text-center block hover:bg-emerald-50 transition-colors shadow-lg shadow-emerald-900/10">
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-10">
                <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center transform rotate-12">
                  <span className="text-white text-xl font-bold font-heading">A</span>
                </div>
                <span className="text-2xl font-bold font-heading">ArtMarket</span>
              </Link>
              <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                The leading platform for high-end AI discovery. Transforming the way the world collects digital art.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-8 text-white uppercase tracking-widest text-sm">Platform</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/artworks" className="hover:text-emerald-400 transition">Marketplace</Link></li>
                <li><Link href="/artworks" className="hover:text-emerald-400 transition">Collections</Link></li>
                <li><Link href="/artworks" className="hover:text-emerald-400 transition">Artists</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-8 text-white uppercase tracking-widest text-sm">Support</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-emerald-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">&copy; 2026 ArtMarket. All rights reserved.</p>
            <div className="flex gap-8 text-slate-500 text-sm font-medium">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">Discord</a>
              <a href="#" className="hover:text-white transition">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}