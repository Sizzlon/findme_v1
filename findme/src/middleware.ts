import { createClient } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Authentication middleware for protecting routes
 * 
 * Note: Next.js 16 shows a deprecation warning for middleware files.
 * The recommendation is to use "proxy" configuration instead, but the proxy
 * feature is not yet fully implemented in Next.js 16.0.1.
 * 
 * This middleware will continue to work and will be migrated to the proxy
 * configuration once the feature is stable and documented.
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Protect authenticated routes
  const protectedPaths = ['/dashboard', '/profile', '/swipe', '/chat', '/vacancies']
  const authPaths = ['/login', '/signup']
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users from protected routes
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth routes
  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}