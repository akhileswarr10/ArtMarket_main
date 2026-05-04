'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Shield, Save, Loader2, 
  Settings as SettingsIcon, Bell, CreditCard, Lock, MapPin
} from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [session, setSession] = useState<any>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Profile')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me', session?.user?.id],
    queryFn: () => fetchApi('/users/me'),
    enabled: !!session,
  })

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  })

  useEffect(() => {
    if (userData) {
      const addr = userData.artist_profile?.address || userData.buyer_profile?.shipping_address || {}
      setFormData({
        displayName: userData.artist_profile?.display_name || userData.buyer_profile?.display_name || '',
        bio: userData.artist_profile?.bio || '',
        address: {
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          zip: addr.zip || '',
          country: addr.country || ''
        }
      })
    }
  }, [userData])

  const mutation = useMutation({
    mutationFn: (updates: any) => fetchApi('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update profile')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      display_name: formData.displayName,
      bio: formData.bio || undefined,
      address: formData.address
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-950 pt-24 px-6 flex justify-center">
        <Loader2 className="w-7 h-7 text-gold-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas-950 pt-10 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold text-ink flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-gold-500" />
            Settings
          </h1>
          <p className="text-ink-secondary mt-2">Manage your account and profile preferences</p>
        </header>

        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          {/* Tabs Sidebar */}
          <aside className="space-y-2">
            {[
              { label: 'Profile', icon: User },
              { label: 'Address', icon: MapPin },
              { label: 'Account', icon: Mail },
              { label: 'Notifications', icon: Bell },
              { label: 'Payments', icon: CreditCard },
              { label: 'Security', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.label 
                    ? 'bg-gold-muted text-gold-400 border border-gold/20' 
                    : 'text-ink-secondary hover:bg-surface/60 hover:text-ink'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border-subtle rounded-2xl shadow-card p-8 shadow-2xl"
            >
              {activeTab === 'Address' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="font-display text-xl font-semibold text-ink mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gold-400" />
                    Shipping & Billing Address
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Street Address</label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: { ...formData.address, street: e.target.value }
                        })}
                        placeholder="123 Art Lane"
                        className="input-galerie w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">City</label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => setFormData({
                            ...formData, 
                            address: { ...formData.address, city: e.target.value }
                          })}
                          placeholder="San Francisco"
                          className="input-galerie w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">State / Province</label>
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => setFormData({
                            ...formData, 
                            address: { ...formData.address, state: e.target.value }
                          })}
                          placeholder="CA"
                          className="input-galerie w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Zip / Postal Code</label>
                        <input
                          type="text"
                          value={formData.address.zip}
                          onChange={(e) => setFormData({
                            ...formData, 
                            address: { ...formData.address, zip: e.target.value }
                          })}
                          placeholder="94103"
                          className="input-galerie w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Country</label>
                        <input
                          type="text"
                          value={formData.address.country}
                          onChange={(e) => setFormData({
                            ...formData, 
                            address: { ...formData.address, country: e.target.value }
                          })}
                          placeholder="United States"
                          className="input-galerie w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-4">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="btn-gold w-full"
                    >
                      {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Address
                    </button>
                    {success && <p className="text-sm text-emerald font-medium">✓ {success}</p>}
                    {error && <p className="text-sm text-rose font-medium">✗ {error}</p>}
                  </div>
                </form>
              )}

              {activeTab === 'Profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-6 mb-8 text-ink">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-600 to-copper flex items-center justify-center text-3xl font-bold shadow-xl shadow-gold-sm">
                      {userData?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold mb-1">Your Avatar</h2>
                      <p className="text-xs text-ink-secondary">JPG, PNG or GIF. Max size 2MB.</p>
                      <button type="button" className="mt-2 text-xs font-bold text-gold-400 hover:text-gold-300">
                        Change Photo
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Display Name</label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        className="input-galerie w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Role</label>
                      <div className="w-full px-4 py-3 bg-surface-raised/70 border border-border-subtle rounded-xl text-gold-400 font-bold uppercase tracking-tighter cursor-not-allowed">
                        {userData?.role || 'Guest'}
                      </div>
                    </div>
                  </div>

                  {userData?.role === 'artist' && (
                    <div className="space-y-2 text-ink">
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Bio</label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="input-galerie w-full resize-none"
                        placeholder="Tell the world about your artistic journey..."
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-4">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="btn-gold w-full"
                    >
                      {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                    {success && <p className="text-sm text-emerald font-medium">✓ {success}</p>}
                    {error && <p className="text-sm text-rose font-medium">✗ {error}</p>}
                  </div>
                </form>
              )}

              {activeTab === 'Account' && (
                <div className="space-y-8 text-ink">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink mb-4">Account Information</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Email Address</label>
                        <div className="px-4 py-3 bg-surface border border-border-subtle rounded-xl shadow-card text-ink-secondary flex items-center justify-between">
                          <span>{userData?.email}</span>
                          <span className="text-[10px] font-bold uppercase text-emerald bg-emerald-muted px-2 py-0.5 rounded">Verified</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-secondary">Account ID</label>
                        <div className="px-4 py-3 bg-surface border border-border-subtle rounded-xl shadow-card text-ink-secondary font-mono text-xs overflow-hidden truncate">
                          {userData?.id}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-border-subtle">
                    <h2 className="font-display text-xl font-semibold text-rose mb-2">Danger Zone</h2>
                    <p className="text-ink-secondary text-sm mb-4">Permanently delete your account and all associated data.</p>
                    <button className="btn-gold">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Notifications' && (
                <div className="space-y-6 text-ink">
                  <h2 className="font-display text-xl font-semibold mb-6">Email Preferences</h2>
                  {[
                    { title: 'New Artworks', desc: 'Get notified when artists you follow publish new pieces.', active: true },
                    { title: 'Market Updates', desc: 'Trending artists and marketplace highlights.', active: false },
                    { title: 'Order History', desc: 'Purchase confirmations and shipping updates.', active: true },
                    { title: 'Security Alerts', desc: 'Important notice about your account security.', active: true },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between p-5 bg-surface/40 border border-border-subtle rounded-2xl hover:bg-surface/60 transition-all">
                      <div className="pr-4">
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-ink-secondary">{item.desc}</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative p-1 transition-colors ${item.active ? 'bg-gold-500' : 'bg-surface-raised'}`}>
                        <div className={`w-4 h-4 bg-canvas-50 rounded-full shadow-sm transition-transform ${item.active ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  ))}
                  <button className="btn-gold w-full">
                    Update Preferences
                  </button>
                </div>
              )}

              {(activeTab === 'Security' || activeTab === 'Payments') && (
                <div className="flex flex-col items-center justify-center py-24 text-center text-ink">
                  <div className="w-20 h-20 rounded-3xl bg-gold-muted flex items-center justify-center text-gold-400 mb-6 border border-gold/20">
                    <Shield className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{activeTab} Hub</h3>
                  <p className="text-ink-secondary max-w-sm text-sm">
                    This section is currently being integrated with our secure provider. 
                    Check back soon for advanced {activeTab.toLowerCase()} management.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
