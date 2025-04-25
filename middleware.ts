// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
  // Check if this is a protected route
  const protectedPaths = ['/profile', '/messages', '/dashboard']
  const path = req.nextUrl.pathname
  
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  )
  
  // Redirect to login if accessing protected routes without a session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/api/auth/login', req.url)
    redirectUrl.searchParams.set('redirectUrl', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}