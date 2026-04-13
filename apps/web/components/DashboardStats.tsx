'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface DashboardStatsProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'emerald' | 'indigo' | 'amber' | 'slate'
  delay?: number
}

const colorStyles = {
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

export default function DashboardStats({ title, value, icon: Icon, color, delay = 0 }: DashboardStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl border transition-colors ${colorStyles[color]} group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
        </div>
      </div>
    </motion.div>
  )
}
