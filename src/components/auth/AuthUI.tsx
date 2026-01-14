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

  // Listen for auth errors
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="w-full max-w-md">
      {authError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{authError}</p>
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
        onError={(error) => {
          console.error('Auth error:', error)
          // Handle CAPTCHA errors specifically
          if (error?.message?.toLowerCase().includes('captcha')) {
            setAuthError('CAPTCHA verification failed. Please ensure your domain is whitelisted in Cloudflare Turnstile settings.')
          } else {
            setAuthError(error?.message || 'Authentication failed. Please try again.')
          }
        }}
      />
    </div>
  )
}