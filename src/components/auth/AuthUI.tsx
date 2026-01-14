'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuthStore } from '@/lib/stores/authStore'

interface AuthUIProps {
  redirectTo?: string
  view?: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password'
  showLinks?: boolean
}

export default function AuthUI({ 
  redirectTo = '/profile', 
  view = 'sign_in', 
  showLinks = true
}: AuthUIProps) {
  const router = useRouter()
  const { user, initialize } = useAuthStore()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  // Listen for auth errors through auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'has session' : 'no session')
      
      if (event === 'SIGNED_IN' && session) {
        setAuthError(null)
      } else if (event === 'SIGNED_OUT') {
        setAuthError(null)
      } else if (event === 'TOKEN_REFRESHED') {
        setAuthError(null)
      } else if (event === 'SIGNED_OUT' && !session) {
        // User was signed out, clear any errors
        setAuthError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Also listen for errors from auth operations
  useEffect(() => {
    // Check for errors in URL params (Supabase sometimes passes errors via redirect)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      
      if (error) {
        console.error('Auth error from URL:', error, errorDescription)
        let errorMessage = errorDescription || error
        
        // Provide specific error messages
        if (errorMessage.toLowerCase().includes('captcha')) {
          errorMessage = 'CAPTCHA verification failed. Check that your domain is whitelisted in Cloudflare Turnstile and Supabase redirect URLs are configured.'
        } else if (errorMessage.toLowerCase().includes('redirect')) {
          errorMessage = 'Redirect URL not authorized. Please add this URL to Supabase redirect URLs list.'
        } else if (errorMessage.toLowerCase().includes('invalid')) {
          errorMessage = 'Invalid credentials or configuration. Check Supabase settings.'
        }
        
        setAuthError(errorMessage)
        
        // Clean up URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])

  return (
    <div className="w-full max-w-md">
      {authError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">Authentication Error</p>
          <p className="text-sm text-red-700 mt-1">{authError}</p>
          {authError.toLowerCase().includes('captcha') && (
            <p className="text-xs text-red-600 mt-2">
              💡 Make sure your domain is whitelisted in Cloudflare Turnstile settings. See TURNSTILE_DOMAIN_SETUP.md for details.
            </p>
          )}
        </div>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3B82F6',
                brandAccent: '#2563EB',
              },
            },
          },
        }}
        providers={['google', 'facebook']}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : '/api/auth/callback'}
        view={view}
        showLinks={showLinks}
        socialLayout="horizontal"
      />
    </div>
  )
}