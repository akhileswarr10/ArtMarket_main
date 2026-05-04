import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '') + '/api'

export default async function DashboardRedirectPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch user role from our DB
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const user = await res.json()
      if (!user.role) {
        redirect('/onboard')
      }
      if (user.role === 'artist') {
        redirect('/artist/dashboard')
      }
      if (user.role === 'admin') {
        redirect('/admin/dashboard')
      }
      redirect('/buyer/dashboard')
    }
  } catch (e) {
    console.error('Failed to fetch user role:', e)
  }

  // Fallback
  redirect('/buyer/dashboard')
}
