import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContainer from '@/components/DashboardContainer'

export const metadata = {
  title: 'Artist Studio — ArtMarket',
  description: 'Manage your artworks and track performance',
}

export default async function ArtistDashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <DashboardContainer session={session} />
}