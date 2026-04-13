import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BuyerDashboardContainer from '@/components/BuyerDashboardContainer'

export const metadata = {
  title: 'Discover Art — ArtMarket',
  description: 'Browse and collect artworks from talented artists',
}

export default async function BuyerDashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <BuyerDashboardContainer session={session} />
}
