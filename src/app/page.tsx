'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import dynamic from 'next/dynamic'

// Dynamically import the Globe component with no SSR
const GlobeComponent = dynamic(() => import('@/components/globe/index').then(mod => mod.GlobeComponent), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center">
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
      <div className="h-screen w-full flex items-center justify-center">
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
    <main className="min-h-screen bg-[#292929] overflow-hidden">
      {/* Hero Section with full-height globe visualization */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background globe visualization */}
        <div className="absolute inset-0 w-full h-full z-0">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400 tracking-widest text-xs uppercase">
                  Loading visualization...
                </div>
              </div>
            }>
              <GlobeComponent 
                groups={[]} 
                height="100vh"
                width="100%"
              />
            </Suspense>
          </ErrorBoundary>
        </div>
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-5"></div>
        
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
                Find Groups
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
          <span className="text-xs uppercase tracking-widest text-gray-400 mb-2">Discover More</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>
        
        {/* Gradient transition to the next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#292929] to-transparent z-10"></div>
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
      
      {/* Benefits Section */}
      <section className="py-20 bg-[#1e1e1e]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-light text-center mb-16 tracking-wider">Why <span className="font-semibold">Join Us</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
              <h3 className="text-2xl font-light mb-4">Find Your Community</h3>
              <p className="text-gray-300 mb-6">
                Connecting with others who share similar experiences can provide invaluable support, validation, and practical guidance through life's challenges.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Connect with people who understand your journey</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Share experiences in a supportive environment</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Discover local resources tailored to your needs</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
              <h3 className="text-2xl font-light mb-4">Lead a Group</h3>
              <p className="text-gray-300 mb-6">
                Have expertise or experience you want to share? Create a group and foster connection in your community.
              </p>
              <p className="text-gray-400 mb-6">
                Our platform makes it easy to register and manage your group, connect with members, and grow your community.
              </p>
              <Link href="/groups/register" className="btn-primary inline-block">
                Register a New Group
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}