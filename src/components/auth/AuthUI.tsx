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

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  return (
    <div className="w-full max-w-md">
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
        redirectTo={`${window.location.origin}/api/auth/callback`}
        view={view}
        showLinks={showLinks}
        socialLayout="horizontal"
      />
    </div>
  )
}