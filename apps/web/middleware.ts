import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const secureRoutes = ['/dashboard', '/onboard', '/artworks/upload']
  const isSecure = secureRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  if (isSecure && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.app_metadata?.role
    // Force onboarding if role is missing and not already on the onboard page
    const isOnboardPage = request.nextUrl.pathname === '/onboard'
    if (!role && !isOnboardPage && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboard'
      return NextResponse.redirect(url)
    }


    // Role-based dashboard redirection
    if (request.nextUrl.pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      if (role === 'artist') {
        url.pathname = '/artist/dashboard'
      } else if (role === 'buyer') {
        url.pathname = '/buyer/dashboard'
      } else {
        url.pathname = '/onboard'
      }

      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}