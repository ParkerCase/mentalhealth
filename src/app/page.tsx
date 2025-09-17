'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import dynamic from 'next/dynamic'

// Define Cesium base URL for client-side use only
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

// Sample group data for demonstration
const exampleGroups = [
  {
    id: 'group-1',
    name: 'New York Support Group',
    geo_location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    },
    city: 'New York',
    state: 'NY'
  },
  {
    id: 'group-2',
    name: 'Los Angeles Community',
    geo_location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522]
    },
    city: 'Los Angeles',
    state: 'CA'
  },
  {
    id: 'group-3',
    name: 'Chicago Network',
    geo_location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781]
    },
    city: 'Chicago',
    state: 'IL'
  },
  // More groups in New York
  {
    id: 'group-4',
    name: "NYC Men's Circle",
    geo_location: {
      type: 'Point',
      coordinates: [-74.0059, 40.7130]
    },
    city: 'New York',
    state: 'NY'
  },
  {
    id: 'group-5',
    name: 'Brooklyn Brotherhood',
    geo_location: {
      type: 'Point',
      coordinates: [-73.9442, 40.6782]
    },
    city: 'New York',
    state: 'NY'
  },
  {
    id: 'group-6',
    name: 'Harlem Supporters',
    geo_location: {
      type: 'Point',
      coordinates: [-73.9442, 40.8116]
    },
    city: 'New York',
    state: 'NY'
  },
  // More groups in LA
  {
    id: 'group-7',
    name: 'LA Wellness',
    geo_location: {
      type: 'Point',
      coordinates: [-118.2436, 34.0524]
    },
    city: 'Los Angeles',
    state: 'CA'
  },
  {
    id: 'group-8',
    name: 'Santa Monica Men',
    geo_location: {
      type: 'Point',
      coordinates: [-118.4912, 34.0195]
    },
    city: 'Los Angeles',
    state: 'CA'
  }
];

// Dynamically import RealisticDayNightGlobe with no SSR
const RealisticDayNightGlobe = dynamic(() => import('@/components/globe/RealisticDayNightGlobe'), { ssr: false });

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
      <div className="h-screen w-full flex items-center justify-center bg-[#292929]">
        <div className="text-gray-400 p-4 max-w-md text-center">
          <p className="text-xl mb-2">Unable to load globe visualization</p>
          <p className="text-sm">Please try a different browser or device.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function Home() {
  const { initialize } = useAuthStore()
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    initialize()
    
    // Force dark mode
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#292929';
    document.body.style.color = '#FFFFFF';
    
    // Try to get user location for better initial experience
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to US center if geolocation fails
          setUserLocation({
            lat: 39.8283,
            lng: -98.5795
          });
        }
      );
    }

    function updateSize() {
      setHeroSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initialize])
  
  // Handle group selection
  const handleGroupSelect = (group: any) => {
    setSelectedGroupId(previousId => 
      previousId === group.id ? undefined : group.id
    );
  };

  return (
    <main className="min-h-screen bg-[#404040] overflow-hidden">
      {/* Hero Section with full-height globe visualization */}
      <section className="relative h-screen flex items-center overflow-visible">
        {/* Background globe visualization - significantly brightened */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-visible pointer-events-none bg-[#2a2a2a]">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400 tracking-wider text-sm">
                  Loading visualization...
                </div>
              </div>
            }>
              <RealisticDayNightGlobe
                groups={exampleGroups}
                interactive={false}
                showSearch={false}
                width={heroSize.width}
                height={heroSize.height}
                style={{ transform: 'scale(1.2) translateY(-5%)' }}
                initialCoordinates={userLocation || { lat: 0, lng: -120 }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
        
        {/* Gradient overlay for better text visibility - significantly brightened */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-5"></div>
        
        {/* Selected group info */}
        {selectedGroupId && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white p-4 rounded z-10 max-w-xs">
            <h3 className="text-lg font-medium mb-1">
              {exampleGroups.find(g => g.id === selectedGroupId)?.name}
            </h3>
            <p className="text-sm opacity-80">
              {exampleGroups.find(g => g.id === selectedGroupId)?.city}, 
              {exampleGroups.find(g => g.id === selectedGroupId)?.state}
            </p>
            <button 
              className="mt-2 bg-blue-600 text-white text-xs px-3 py-1 rounded"
              onClick={() => setSelectedGroupId(undefined)}
            >
              Close
            </button>
          </div>
        )}
        
        {/* Content overlay */}
        <div className="container relative mx-auto px-4 sm:px-6 z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight mb-4 sm:mb-6">
              <span className="block opacity-90">Hello, my Beautiful Brothers!</span>
              <span className="block text-xs sm:text-sm uppercase tracking-[0.2em] mt-2 sm:mt-3 mb-4 sm:mb-8 font-light">
                Welcome to Arise Divine Masculine
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl font-light text-gray-300 mb-8 sm:mb-12 max-w-2xl opacity-80">
              We are a growing international community of men ready to face their shadows, fears and beliefs in search of a deeper connection to their soul, men who are ready to transmute their victim story, exhausted with living unconsciously and want to heed the call of living in their Power.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Link
                href="/locator"
                className="btn-primary inline-block mobile-button sm:w-auto"
              >
                Find Groups
              </Link>
              <Link
                href="/groups/register"
                className="btn-secondary inline-block mobile-button sm:w-auto"
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#404040] to-transparent z-10"></div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 sm:py-20 bg-[#404040]">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-light text-center mb-8 sm:mb-16 tracking-wider">Our <span className="font-semibold">Goals</span></h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-sm mb-4">
                <span className="text-lg font-light">01</span>
              </div>
              <h3 className="text-lg font-light mb-3 tracking-wide">Global Directory</h3>
              <p className="text-gray-400 font-light text-sm">
                Create a thorough directory of men's healing groups around the world.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-sm mb-4">
                <span className="text-lg font-light">02</span>
              </div>
              <h3 className="text-lg font-light mb-3 tracking-wide">Easy Discovery</h3>
              <p className="text-gray-400 font-light text-sm">
                Help men find groups in their area that resonate with them, along with a local calendar of events.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-sm mb-4">
                <span className="text-lg font-light">03</span>
              </div>
              <h3 className="text-lg font-light mb-3 tracking-wide">Group Growth</h3>
              <p className="text-gray-400 font-light text-sm">
                Facilitate growth for existing men's groups by spreading awareness of their existence.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-sm mb-4">
                <span className="text-lg font-light">04</span>
              </div>
              <h3 className="text-lg font-light mb-3 tracking-wide">Leader Connection</h3>
              <p className="text-gray-400 font-light text-sm">
                Bring together Leaders, Founders and Organizers to share lessons learned and effective practices.
              </p>
            </div>
            
            <div className="card backdrop-blur-md border border-white/5">
              <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-sm mb-4">
                <span className="text-lg font-light">05</span>
              </div>
              <h3 className="text-lg font-light mb-3 tracking-wide">Global Brotherhood</h3>
              <p className="text-gray-400 font-light text-sm">
                Foster a global community of Awake men who share cross-cultural, experiential and innate wisdom.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section - Simplified for better performance */}
      <section className="py-20 bg-[#2a2a2a]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-light text-center mb-16 tracking-wider">Why <span className="font-semibold">Join Us</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
              <h3 className="text-2xl font-light mb-4">Find Your Brotherhood</h3>
              <p className="text-gray-300 mb-6">
                Connect with men who are ready to face their shadows, transmute their victim story, and live in their Power. Join a community of brothers on the path of conscious awakening.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Connect with men who resonate with your journey of transformation</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Share your stories and experiences in a supportive environment</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1">•</div>
                  <span>Discover local men's groups and healing communities</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
              <h3 className="text-2xl font-light mb-4">Lead Your Community</h3>
              <p className="text-gray-300 mb-6">
                Ready to step into leadership? Create a men's group and foster deep connection in your community. Share your wisdom and guide others on their journey.
              </p>
              <p className="text-gray-400 mb-6">
                Our platform makes it easy to register and manage your group, connect with members, and grow your community of conscious men.
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