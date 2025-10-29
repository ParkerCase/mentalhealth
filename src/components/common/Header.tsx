'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { FaEnvelope, FaBars, FaTimes, FaUser, FaHeart } from 'react-icons/fa'

export default function Header() {
  const pathname = usePathname()
  const { user, profile, initialize, loading } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Track scroll position to add background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Check if we should use a transparent header for certain pages
  const isTransparentPage = pathname === '/' || pathname === '/locator'

  const navItems = [
    { name: 'Home', path: '/', icon: FaHeart },
    { name: 'Locator', path: '/locator', icon: FaEnvelope },
    { name: 'About', path: '/who-we-are', icon: FaUser },
    { name: 'Archives', path: '/archives', icon: FaEnvelope },
    { name: 'Contact', path: '/contact', icon: FaEnvelope },
  ]

  // Add dashboard link if user is logged in
  const userNavItems = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: FaHeart },
    ...navItems,
    { name: 'Messages', path: '/messages', icon: FaEnvelope },
    { name: 'Profile', path: '/profile', icon: FaUser },
  ] : navItems

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparentPage 
          ? scrolled 
            ? 'bg-[#292929]/95 backdrop-blur-md shadow-lg py-4' 
            : 'bg-transparent py-6'
          : 'bg-[#292929]/95 backdrop-blur-md py-4'
      }`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center">
            {/* Logo - Responsive sizing */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="sr-only">Arise Divine Masculine Home</span>
                <Image 
                  src="/logo.PNG"
                  alt="Arise Divine Masculine Logo"
                  width={isMobile ? 120 : 160}
                  height={isMobile ? 36 : 48}
                  className="transition-all duration-300"
                  priority
                />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-4">
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
            
            {/* User Profile/Login Section */}
            <div className="flex items-center space-x-3">
              {!loading && user ? (
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/messages" className="nav-link hidden lg:block">
                    <FaEnvelope className="text-lg" />
                  </Link>
                  <Link 
                    href="/profile" 
                    className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-full border border-white/10 transition-colors hover:bg-white/10"
                  >
                    {profile?.avatar_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-blue-400">
                        <Image 
                          src={profile.avatar_url} 
                          alt={profile.username || 'User'} 
                          width={24} 
                          height={24}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-light tracking-wide hidden lg:inline">
                      {profile?.username || 'Profile'}
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex space-x-3">
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
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-[#292929] shadow-2xl animate-slideInFromRight">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Menu</h2>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                  aria-label="Close menu"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              {/* User Profile Section (if logged in) */}
              {user && (
                <div className="p-6 border-b border-white/10">
                  <Link 
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-400">
                        <Image 
                          src={profile.avatar_url} 
                          alt={profile.username || 'User'} 
                          width={40} 
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <FaUser />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {profile?.full_name || profile?.username || 'Your Profile'}
                      </p>
                      <p className="text-gray-400 text-sm">View profile</p>
                    </div>
                  </Link>
                </div>
              )}
              
              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-6">
                <nav className="space-y-2">
                  {userNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link 
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-manipulation ${
                          pathname === item.path
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="text-lg flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
              
              {/* Login/Logout Section */}
              <div className="p-6 border-t border-white/10">
                {user ? (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false)
                      // Handle logout
                      window.location.href = '/api/auth/logout'
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 text-red-400 hover:text-red-300 transition-colors touch-manipulation"
                  >
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link 
                      href="/api/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center py-3 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors touch-manipulation"
                    >
                      Login
                    </Link>
                    <Link 
                      href="/api/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}