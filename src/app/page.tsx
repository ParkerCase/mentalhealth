// src/app/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import dynamic from 'next/dynamic'

// Dynamically import the Globe component with no SSR
const Globe = dynamic(() => import('@/components/map/Globe'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-500">Loading interactive globe...</div>
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
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-500">Unable to load globe visualization.</div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function Home() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl font-bold mb-4">Find Your Community</h1>
          <p className="text-lg mb-6">
            Connect with support groups and communities in your area. Whether you're looking for 
            help or want to offer support to others, we're here to help you find your people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/locator"
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Find Groups Near You
            </Link>
            <Link
              href="/groups/register"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-center hover:bg-gray-300 transition-colors"
            >
              Register Your Group
            </Link>
          </div>
        </div>
        
        <div className="md:w-1/2 h-96">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-gray-500">Loading interactive globe...</div>
              </div>
            }>
              <Globe />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Search</h3>
            <p className="text-gray-600">
              Use our locator tool to find support groups and communities in your area.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Connect</h3>
            <p className="text-gray-600">
              Reach out to groups that match your needs through our secure messaging system.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Join</h3>
            <p className="text-gray-600">
              Attend meetings, participate in events, and become part of a supportive community.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}