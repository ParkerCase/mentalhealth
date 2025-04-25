// src/components/common/Header.tsx
'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEffect } from 'react'
import { FaUser, FaEnvelope } from 'react-icons/fa'
import Image from 'next/image'
import Navigation from './Navigation'

export default function Header() {
  // No longer need pathname here
  const { user, profile, initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Navigation items moved to Navigation component

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Social Connection
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {!loading && user ? (
              <div className="flex items-center space-x-4">
                <Link href="/messages" className="relative">
                  <FaEnvelope className="text-gray-600 text-xl" />
                  {/* Add notification indicator if needed */}
                </Link>
                <div className="flex items-center space-x-2">
                  <Link href="/profile" className="flex items-center">
                    {profile?.avatar_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image 
                          src={profile.avatar_url} 
                          alt={profile.username || 'User'} 
                          width={32} 
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUser className="text-gray-500" />
                      </div>
                    )}
                    <span className="ml-2 hidden md:block">{profile?.username || 'User'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link 
                  href="/api/auth/login" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link 
                  href="/api/auth/register" 
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <Navigation />
      </div>
    </header>
  )
}