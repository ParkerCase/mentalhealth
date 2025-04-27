'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEffect } from 'react'
import Image from 'next/image'
import { FaEnvelope } from 'react-icons/fa'

export default function Header() {
  const pathname = usePathname()
  const { user, profile, initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Locator', path: '/locator' },
    { name: 'About', path: '/who-we-are' },
    { name: 'Archives', path: '/archives' },
    { name: 'Contact', path: '/contact' },
  ]

  return (
    <header className="bg-transparent py-6">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-light tracking-wider text-white">
              Social<span className="font-bold">Connect</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={pathname === item.path ? 'nav-link-active' : 'nav-link'}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-6">
            {!loading && user ? (
              <div className="flex items-center space-x-4">
                <Link href="/messages" className="nav-link">
                  <FaEnvelope className="text-lg" />
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-sm border border-white/10 transition-colors hover:bg-white/10"
                >
                  {profile?.avatar_url ? (
                    <div className="w-7 h-7 rounded-sm overflow-hidden">
                      <Image 
                        src={profile.avatar_url} 
                        alt={profile.username || 'User'} 
                        width={28} 
                        height={28}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 bg-[#616161] rounded-sm flex items-center justify-center text-xs">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-light tracking-wide">{profile?.username || 'Profile'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link 
                  href="/api/auth/login" 
                  className="px-4 py-2 text-sm font-light tracking-wider hover:text-white text-gray-300 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/api/auth/register" 
                  className="btn-primary"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile navigation - hidden on desktop */}
        <div className="md:hidden mt-4">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`px-3 py-2 text-xs uppercase tracking-wider ${
                  pathname === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}