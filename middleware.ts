// middleware.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('=== MIDDLEWARE RUNNING ===')
  console.log('Path:', req.nextUrl.pathname)
  
  const res = NextResponse.next()
  
  // Get the auth cookie
  const supabaseAuthCookie = req.cookies.get('supabase-auth-token')?.value
  
  // Check if user is authenticated
  let isAuthenticated = false
  
  if (supabaseAuthCookie) {
    try {
      // Parse the cookie
      const [access_token, refresh_token] = JSON.parse(supabaseAuthCookie)
      
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
      
      isAuthenticated = !!data.session
    } catch (e) {
      console.error('Error parsing auth cookie:', e)
    }
  }
  
  // Define protected routes that require authentication
  const protectedPaths = [
    '/profile',
    '/messages',
    '/dashboard',
    '/admin',
    '/groups/register',
    '/locator',
  ]
  
  // Get the pathname from the request
  const path = req.nextUrl.pathname
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  )
  
  // If this is a protected path and the user is not logged in, redirect to login
  if (isProtectedPath && !isAuthenticated) {
    console.log('Redirecting unauthenticated user from:', path, 'to login page')
    // Create the redirect URL with the current path as the redirectUrl query parameter
    const redirectUrl = new URL('/api/auth/login', req.url)
    redirectUrl.searchParams.set('redirectUrl', path)
    
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/locator',
    '/profile',
    '/messages',
    '/dashboard',
    '/admin',
    '/groups/register',
  ],
}