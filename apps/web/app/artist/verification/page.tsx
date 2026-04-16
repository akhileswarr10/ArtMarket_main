'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { fetchApi, applyForVerification } from '@/lib/api/client'

export default function ArtistVerificationPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchApi('/users/me').then((data) => {
      setProfile(data.artist_profile)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const handleApply = async () => {
    setSubmitting(true)
    try {
      const res = await applyForVerification()
      setProfile({ ...profile, verification_status: res.status })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex justify-center pt-32"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 pt-24 pb-20">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Artist Verification</h1>
          <p className="text-slate-400">Join our curated list of verified artists to gain trust and visibility.</p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 text-center">
             {profile?.verification_status === 'verified' && (
                 <div>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">You are Verified!</h2>
                    <p className="text-slate-400 mt-2">Your artworks feature a verified badge across the marketplace.</p>
                 </div>
             )}
             {profile?.verification_status === 'pending' && (
                 <div>
                    <Loader2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-[spin_3s_linear_infinite]" />
                    <h2 className="text-2xl font-bold text-white">Application Pending</h2>
                    <p className="text-slate-400 mt-2">Our curation team is reviewing your profile. You will be notified soon.</p>
                 </div>
             )}
             {(profile?.verification_status === 'unverified' || !profile?.verification_status) && (
                 <div>
                    <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Unverified Status</h2>
                    <p className="text-slate-400 mt-2 mb-8">Before applying, ensure your portfolio is up to date with high-quality original artworks.</p>
                    
                    {profile?.verification_notes && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl mb-8 text-left">
                        <strong>Previous Rejection Reason:</strong> {profile.verification_notes}
                      </div>
                    )}

                    <button 
                        onClick={handleApply}
                        disabled={submitting}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 w-full max-w-sm mx-auto"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                    </button>
                 </div>
             )}
        </div>
      </div>
    </div>
  )
}
