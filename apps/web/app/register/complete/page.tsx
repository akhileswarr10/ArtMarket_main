// Redirect old /register/complete path to the new /onboard route
import { redirect } from 'next/navigation'

export default function RegisterCompletePage() {
  redirect('/onboard')
}