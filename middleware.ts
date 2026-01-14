// middleware.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Check if a user has admin access based on their email domain
 */
function hasAdminAccess(email: string | null | undefined): boolean {
  if (!email) return false
  const allowedEmails = ['jongfisher70@gmail.com', 'parkere.case@gmail.com']
  return allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())
}

export async function middleware(req: NextRequest) {
  try {
    console.log('=== MIDDLEWARE RUNNING ===')
    console.log('Path:', req.nextUrl.pathname)
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    
    // Handle HEAD requests (for curl -I)
    if (req.method === 'HEAD') {
      return NextResponse.next()
    }
    
    const res = NextResponse.next()
    
    // Check if user is authenticated
    // For middleware, we need to manually check cookies since Supabase stores sessions client-side
    let isAuthenticated = false
    let userEmail: string | null = null
    
    // Check for our custom auth cookie first
    const supabaseAuthCookie = req.cookies.get('supabase-auth-token')?.value
    
    if (supabaseAuthCookie) {
      try {
        const [access_token, refresh_token] = JSON.parse(supabaseAuthCookie)
        
        if (access_token) {
          // Create supabase client
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          // Set the session manually
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          
          if (data.session && !error) {
            isAuthenticated = true
            userEmail = data.session.user?.email || null
            console.log('Authentication check result: TRUE')
            console.log('User email:', userEmail)
          }
        }
      } catch (e) {
        console.error('Error parsing auth cookie:', e)
      }
    }
    
    // If no custom cookie, check if user might be authenticated via localStorage (client-side only)
    // In this case, we can't check it in middleware, so we'll allow the request through
    // and let the client-side handle the redirect if needed
    console.log('Is authenticated:', isAuthenticated)
    
    // Define protected routes that require authentication
    // NOTE: /locator and /groups/register are handled client-side to avoid middleware issues
    const protectedPaths = [
      '/profile',
      '/messages',
      '/dashboard',
      '/admin',
      // '/groups/register', // Handled client-side
      // '/locator', // Handled client-side
    ]
    
    // Get the pathname from the request
    const path = req.nextUrl.pathname
    
    // Check if the current path is protected
    const isProtectedPath = protectedPaths.some(protectedPath => 
      path === protectedPath || path.startsWith(`${protectedPath}/`)
    )
    
    // Check if this is an admin path
    const isAdminPath = path === '/admin' || path.startsWith('/admin/')
    
    console.log('Is protected path:', isProtectedPath)
    console.log('Is admin path:', isAdminPath)
    console.log('Is authenticated:', isAuthenticated)
    
    // If this is a protected path and the user is not logged in, redirect to login
    // BUT: Don't redirect if we're already on the login/register page (prevents loops)
    if (isProtectedPath && !isAuthenticated && !path.startsWith('/api/auth/')) {
      console.log('Redirecting unauthenticated user from:', path, 'to login page')
      // Create the redirect URL with the current path as the redirectUrl query parameter
      const redirectUrl = new URL('/api/auth/login', req.url)
      redirectUrl.searchParams.set('redirectUrl', path)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // If this is an admin path, check if user has admin access
    if (isAdminPath && isAuthenticated) {
      const userHasAdminAccess = hasAdminAccess(userEmail)
      console.log('Admin access check:', userHasAdminAccess, 'for email:', userEmail)
      
      if (!userHasAdminAccess) {
        console.log('Redirecting non-admin user from admin path:', path)
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Only run middleware on specific paths
// NOTE: /locator and /groups/register are NOT in matcher - handled client-side only
export const config = {
  matcher: [
    '/profile',
    '/messages',
    '/dashboard',
    '/admin',
    // '/locator', // Removed - handled client-side
    // '/groups/register', // Removed - handled client-side
  ],
}