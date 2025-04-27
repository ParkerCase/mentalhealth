'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import dynamic from 'next/dynamic'

// Dynamically import the Globe component with no SSR
const Globe = dynamic(() => import('@/components/map/Globe'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center">
      <div className="animate-pulse text-gray-400 tracking-widest text-xs uppercase">
        Loading visualization...
      </div>
    </div>
  )
})

// Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-gray-400">Unable to load visualization.</div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function Home() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
    
    // Force dark mode
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#292929';
    document.body.style.color = '#FFFFFF';
    
  }, [initialize])

  return (
    <main className="min-h-screen bg-[#292929]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background globe visualization */}
        <div className="absolute inset-0 w-full h-full">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-400 tracking-widest text-xs uppercase">
                  Loading visualization...
                </div>
              </div>
            }>
              <Globe />
            </Suspense>
          </ErrorBoundary>
        </div>
        
        {/* Content overlay */}
        <div className="container relative mx-auto px-6 z-10">
          <div className="max-w-3xl">
            <h1 className="text-7xl font-extralight tracking-tight mb-6">
              <span className="block opacity-90">creativity</span>
              <span className="block text-sm uppercase tracking-[0.2em] mt-3 mb-8 font-light">
                We believe creativity begins with an observation
              </span>
            </h1>
            
            <p className="text-xl font-light text-gray-300 mb-12 max-w-lg opacity-80">
              Connect with support groups and communities in your area.
              Find your people, or offer support to others.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/locator"
                className="btn-primary inline-block"
              >
                Start a Project
              </Link>
              <Link
                href="/groups/register"
                className="btn-secondary inline-block"
              >
                Register Your Group
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-gray-400 mb-2">Discover More</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-[#292929]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-light text-center mb-16 tracking-wider">How It <span className="font-semibold">Works</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-16 h-16 flex items-center justify-center border border-white/10 rounded-sm mb-6">
                <span className="text-2xl font-light">01</span>
              </div>
              <h3 className="text-xl font-light mb-4 tracking-wide">Search</h3>
              <p className="text-gray-400 font-light">
                Use our locator tool to find support groups and communities in your area.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-16 h-16 flex items-center justify-center border border-white/10 rounded-sm mb-6">
                <span className="text-2xl font-light">02</span>
              </div>
              <h3 className="text-xl font-light mb-4 tracking-wide">Connect</h3>
              <p className="text-gray-400 font-light">
                Reach out to groups that match your needs through our secure messaging system.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-16 h-16 flex items-center justify-center border border-white/10 rounded-sm mb-6">
                <span className="text-2xl font-light">03</span>
              </div>
              <h3 className="text-xl font-light mb-4 tracking-wide">Join</h3>
              <p className="text-gray-400 font-light">
                Attend meetings, participate in events, and become part of a supportive community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}