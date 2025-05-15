'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import Link from 'next/link'
import AuthUI from '@/components/auth/AuthUI'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a redirect URL in the query parameters
      const redirect = searchParams?.get('redirectUrl')
      router.push(redirect || '/profile')
    }
  }, [user, loading, router, searchParams])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>You are already logged in. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create a new account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link href="/api/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                sign in to your existing account
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <AuthUI 
              view="sign_up" 
              redirectTo="/profile"
            />
          </div>
        </div>
      </div>
      <div
  className="hidden lg:block relative w-0 flex-1 bg-cover bg-center"
  style={{ backgroundImage: "url('/assets/lion-for-site.jpg')" }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>

  {/* Content on top of background + overlay */}
  <div className="relative z-20 flex flex-col justify-center items-center h-full text-white px-8">
          <h1 className="text-4xl font-bold mb-6">Join Our Community</h1>
          <p className="text-xl mb-8 text-center">Create an account to connect with support groups and find resources tailored to your needs.</p>
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur-md max-w-md">
            <p className="text-lg">&quot;Finding the right community changed my life. I realized I wasn't alone as I felt once I began my journey.&quot;</p>
            <p className="mt-4 font-semibold">— Parker C., Community Member</p>
          </div>
        </div>
      </div>
    </div>
  )
}