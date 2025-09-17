'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuthStore } from '@/lib/stores/authStore'
import ReCaptchaWrapper from './ReCaptchaWrapper'

interface ReCaptchaAuthFormProps {
  redirectTo?: string
  view?: 'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password'
  showLinks?: boolean
}

export default function ReCaptchaAuthForm({ 
  redirectTo = '/profile', 
  view = 'sign_in', 
  showLinks = true
}: ReCaptchaAuthFormProps) {
  const router = useRouter()
  const { user, initialize } = useAuthStore()
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  const handleRecaptchaVerify = (token: string) => {
    setRecaptchaToken(token)
    setIsRecaptchaVerified(true)
  }

  const handleRecaptchaExpired = () => {
    setRecaptchaToken('')
    setIsRecaptchaVerified(false)
  }

  // Override the default Auth component to include reCAPTCHA
  const CustomAuth = () => {
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
          providers={['google']}
          redirectTo={`${window.location.origin}/api/auth/callback`}
          view={view}
          showLinks={showLinks}
          socialLayout="horizontal"
        />
        
        {/* Add reCAPTCHA below the auth form */}
        <div className="mt-4">
          <ReCaptchaWrapper 
            onVerify={handleRecaptchaVerify}
            onExpired={handleRecaptchaExpired}
          />
        </div>
        
        {/* Show verification status */}
        {isRecaptchaVerified && (
          <div className="mt-2 text-sm text-green-600">
            ✅ reCAPTCHA verified
          </div>
        )}
      </div>
    )
  }

  return <CustomAuth />
} 