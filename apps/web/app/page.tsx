'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Zap, LayoutGrid, Palette, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [supabase])

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500 to-transparent blur-[100px] rounded-full mix-blend-screen mix-blend-lighten" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={{
                animate: { transition: { staggerChildren: 0.1 } }
              }}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8">
                <Sparkles className="w-3 h-3" />
                AI-Powered Art Discovery
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.1] mb-8 text-white">
                <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Discover</span> the <br />Future of Art.
              </motion.h1>

              <motion.p variants={fadeIn} className="text-xl text-slate-400 leading-relaxed mb-12 max-w-lg">
                The premier marketplace where human creativity meets AI innovation. Discover unique pieces from the world's most visionary digital artists.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <Link href="/artworks" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 group">
                  Explore Collection
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {!session && (
                  <Link href="/register" className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 transition-all duration-300">
                    Join as Artist
                  </Link>
                )}
              </motion.div>

              <motion.div variants={fadeIn} className="mt-20 flex gap-12 border-t border-white/10 pt-12">
                {[
                  { label: 'Artists', value: '10K+' },
                  { label: 'Artworks', value: '50K+' },
                  { label: 'Volume', value: '$2.4M' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="relative aspect-[4/5] lg:aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-[3rem] -rotate-6 scale-[1.02] shadow-2xl shadow-indigo-500/20 opacity-30"></div>
              <div className="relative h-full w-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group bg-slate-900">
                <Image 
                  src="/artwork-1.png" 
                  alt="Elite Artwork" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-10">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-1">Ethereal Currents</h3>
                    <p className="text-indigo-300 text-sm font-medium uppercase tracking-widest">By AI Visionary</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-5"
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Auction</div>
                  <div className="text-lg font-black text-white">4.58 ETH</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-slate-900/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">The ArtMarket Experience</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We're redefining how art is created, discovered, and collected using high-performance AI integration.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Palette className="w-8 h-8" />, 
                title: 'AI Smart Tagging', 
                desc: 'Our models automatically generate evocative titles and metadata for your creations.',
                color: 'indigo'
              },
              { 
                icon: <LayoutGrid className="w-8 h-8" />, 
                title: 'Curated Galleries', 
                desc: 'Highly aesthetic collection displays optimized for desktop and mobile devices.',
                color: 'violet'
              },
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: 'Buyer Protection', 
                desc: 'Identity verification and secure transaction protocols for total peace of mind.',
                color: 'emerald'
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
              >
                <div className={`w-16 h-16 bg-${f.color}-500/20 rounded-2xl flex items-center justify-center text-${f.color}-400 mb-8 border border-${f.color}-500/30 shadow-[0_0_15px_rgba(0,0,0,0.2)] shadow-${f.color}-500/20`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Featured This Week</h2>
              <p className="text-slate-400 text-lg">Hand-picked selections from our AI-First artist community.</p>
            </div>
            <Link href="/artworks" className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/10">
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
                <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-6 relative bg-slate-900 border border-white/10">
                  <Image 
                    src={item === 1 ? "/artwork-1.png" : "/artwork-2.png"}
                    alt="Featured Art" 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute top-5 right-5 flex gap-2">
                    <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-rose-500 transition-all border border-white/10">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors cursor-pointer">
                      {item === 1 ? 'Ethereal Currents' : 'Regal Synthesis'}
                    </h3>
                    <div className="text-lg font-black text-emerald-400">${((0.5 * item + 0.2)*2000).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    AI Pioneer
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Call to Action Card in the grid */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="relative z-10 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4">Start your collection today.</h3>
                <p className="text-indigo-200 mb-8 font-medium">Own a piece of the future with verified ownership and authenticity.</p>
                <Link href="/register" className="w-full py-4 bg-white text-indigo-900 rounded-xl font-black text-center block hover:bg-indigo-50 transition-colors shadow-lg">
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/5 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-10">
                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                   <Palette className="w-5 h-5 text-white" />
                 </div>
                <span className="text-2xl font-bold text-white">ArtMarket</span>
              </Link>
              <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                The leading platform for high-end AI discovery. Transforming the way the world collects digital art.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-8 text-white uppercase tracking-widest text-sm">Platform</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/artworks" className="hover:text-indigo-400 transition">Marketplace</Link></li>
                <li><Link href="/artworks" className="hover:text-indigo-400 transition">Collections</Link></li>
                <li><Link href="/artworks" className="hover:text-indigo-400 transition">Artists</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-8 text-white uppercase tracking-widest text-sm">Support</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-indigo-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
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