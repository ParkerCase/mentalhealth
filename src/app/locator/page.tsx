// src/app/locator/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { FaInfoCircle, FaEdit, FaPaperPlane, FaSpinner, FaTimes } from 'react-icons/fa'
import dynamic from 'next/dynamic'
const RealisticDayNightGlobe = dynamic(() => import('@/components/globe/RealisticDayNightGlobe'), { ssr: false })
import { GroupData } from '@/components/globe/SimpleGlobe'

export default function Locator() {
  const router = useRouter()
  const { user, loading: authLoading, initialize } = useAuthStore()
  const [groups, setGroups] = useState<GroupData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [initialCoordinates, setInitialCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const globeRef = useRef<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Initialize auth
  useEffect(() => {
    initialize()
  }, [initialize])
  
  // Try to get user location for better initial experience
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInitialCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          // Fallback to US center if geolocation fails
          setInitialCoordinates({
            lat: 39.8283,
            lng: -98.5795
          })
        }
      )
    }
  }, [])
  
  // Fetch groups from Supabase
  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('approved', true)
      
      if (error) throw error
      
      // Transform the data to match our GroupData structure
      const formattedGroups = data.map(group => {
        // First check for geo_location and extract coordinates
        let lat = 0, lng = 0
        if (group.geo_location && 
            group.geo_location.coordinates && 
            Array.isArray(group.geo_location.coordinates) && 
            group.geo_location.coordinates.length >= 2) {
          // GeoJSON stores coordinates as [longitude, latitude]
          lng = group.geo_location.coordinates[0]
          lat = group.geo_location.coordinates[1]
        }
        
        return {
          id: group.id,
          name: group.name,
          lat,
          lng,
          city: group.city,
          state: group.state,
          description: group.description,
          email: group.email,
          phone: group.phone,
          website: group.website
        }
      })
      
      setGroups(formattedGroups)
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Load groups on page load
  useEffect(() => {
    fetchGroups()
    
    // Set up real-time subscription for approved groups
    const groupsChannel = supabase
      .channel('approved-groups')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'groups',
        filter: 'approved=eq.true'
      }, () => fetchGroups())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'groups',
        filter: 'approved=eq.true'
      }, () => fetchGroups())
      .subscribe()
    
    return () => {
      supabase.removeChannel(groupsChannel)
    }
  }, [fetchGroups, supabase])

  // Handle group selection from the globe
  const handleGroupSelect = (group: GroupData) => {
    setSelectedGroup(group)
  }
  
  // Send message to a group
  const sendMessage = async (groupId: string) => {
    if (!user && !authLoading) {
      setRequiresLogin(true)
      return
    }
    
    try {
      // Check if a conversation already exists
      const { data: existingConversation, error: queryError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user!.id)
        .eq('group_id', groupId)
        .single()
      
      if (existingConversation) {
        router.push(`/messages/${existingConversation.id}`)
        return
      }
      
      // Create a new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user!.id,
          group_id: groupId
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating conversation:', error)
        return
      }
      
      router.push(`/messages/${newConversation.id}`)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
  
  // Search handler for parent search bar
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (globeRef.current && globeRef.current.pointOfView) {
          globeRef.current.pointOfView({ lat: parseFloat(lat), lng: parseFloat(lon), altitude: 2.5 }, 1200);
        }
        setAutoRotate(false);
      } else {
        setSearchError('Location not found.');
      }
    } catch (err) {
      setSearchError('Error searching location.');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // State to track if an overlay/modal is open
  const overlayOpen = Boolean(selectedGroup) || (!isLoading && groups.length === 0);
  
  return (
    <div className="min-h-screen bg-[#292929] overflow-x-hidden">
      {/* Login notification panel - Mobile optimized */}
      {requiresLogin && (
        <div className={`fixed z-50 bg-[#4A3E33] border-l-2 border-[#FFD700] p-4 rounded-sm backdrop-blur-sm shadow-lg ${
          isMobile 
            ? 'top-16 left-4 right-4' 
            : 'top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="text-[#FFD700] mt-1" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm text-white/80">
                You need to be logged in to contact groups. {' '}
                <Link href="/api/auth/login?redirectUrl=/locator" className="text-blue-400 hover:text-blue-300 underline">
                  Login
                </Link> or {' '}
                <Link href="/api/auth/register?redirectUrl=/locator" className="text-blue-400 hover:text-blue-300 underline">
                  Register
                </Link> to continue.
              </p>
              <button 
                className="mt-2 text-xs text-gray-300 hover:text-white touch-manipulation"
                onClick={() => setRequiresLogin(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Globe Visualization - FULLSCREEN, HERO OVERLAY */}
      <div className="relative w-screen h-screen overflow-hidden" style={{margin: 0, padding: 0}}>
        {/* Mobile-optimized search bar */}
        <form
          onSubmit={handleSearch}
          className={`fixed z-40 ${
            isMobile 
              ? 'top-16 left-2 right-2' 
              : 'top-24 left-1/2 transform -translate-x-1/2 min-w-[320px] max-w-[90vw]'
          }`}
          style={{
            background: 'rgba(0,0,0,0.8)', 
            borderRadius: 8, 
            padding: isMobile ? 8 : 12, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder={isMobile ? "Search location..." : "Search for a city or place..."}
            className="flex-1 rounded border-none outline-none text-gray-900"
            style={{ 
              padding: isMobile ? '8px 12px' : '10px 14px', 
              borderRadius: 6,
              fontSize: isMobile ? '16px' : '14px', // Prevents zoom on iOS
              minWidth: 0
            }}
            disabled={searchLoading}
          />
          <button 
            type="submit" 
            disabled={searchLoading || !searchValue.trim()} 
            className="bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ 
              padding: isMobile ? '8px 12px' : '10px 16px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 600
            }}
          >
            {searchLoading ? (isMobile ? '...' : 'Searching...') : 'Go'}
          </button>
          {searchError && (
            <div className={`text-red-400 text-xs ${isMobile ? 'absolute top-full left-0 right-0 mt-2 bg-black/80 p-2 rounded' : 'ml-2'}`}>
              {searchError}
              {isMobile && (
                <button 
                  onClick={() => setSearchError(null)}
                  className="ml-2 text-white/60"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          )}
        </form>

        {/* Hero overlay - Mobile responsive */}
        <div className={`absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-10 transition-opacity duration-300 px-4 ${overlayOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-none'}`}> 
          <h1 className={`font-light tracking-wide mb-4 text-white text-center drop-shadow-lg ${
            isMobile ? 'text-3xl sm:text-4xl' : 'text-5xl md:text-6xl'
          }`}>
            <span className="font-normal">Find</span> Groups
          </h1>
          <p className={`text-gray-300 mb-8 max-w-3xl text-center ${
            isMobile ? 'text-base px-4' : 'text-xl'
          }`}>
            Discover support groups and communities in your area. Connect with others on similar journeys.
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <RealisticDayNightGlobe
            ref={globeRef}
            groups={groups}
            onGroupSelect={g => handleGroupSelect(g as GroupData)}
            interactive={true}
            showSearch={false}
            width="100vw"
            height="100vh"
            style={{ width: '100vw', height: '100vh' }}
            initialCoordinates={initialCoordinates}
            showAtmosphereBackground={false}
            autoRotate={autoRotate}
            globeScale={isMobile ? 1.0 : 1.35}
          />
        )}

        {/* Overlay backdrop for modals/cards */}
        {overlayOpen && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300" style={{pointerEvents: 'auto'}} />
        )}

        {/* Selected Group Details - Mobile optimized */}
        {selectedGroup && (
          <div className={`absolute z-30 bg-black/80 backdrop-blur-md rounded-lg border border-gray-600 pointer-events-auto ${
            isMobile 
              ? 'inset-x-4 top-20 bottom-20 overflow-y-auto'
              : 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full mx-4'
          }`}>
            <div className="p-4 sm:p-6">
              {/* Mobile close button */}
              {isMobile && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              )}

              <div className={`${isMobile ? 'space-y-4' : 'flex flex-col md:flex-row md:justify-between md:items-start'}`}>
                <div className={`${isMobile ? '' : 'mb-6 md:mb-0 md:max-w-2xl'}`}>
                  <h2 className={`font-light text-white mb-3 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {selectedGroup.name}
                  </h2>
                  <div className="text-gray-400 mb-4 text-sm">
                    {[selectedGroup.city, selectedGroup.state]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div className="text-gray-300 mb-6 text-sm leading-relaxed">
                    {selectedGroup.description}
                  </div>
                  
                  {/* Contact methods - Mobile stacked */}
                  <div className={`${isMobile ? 'space-y-3' : 'flex flex-wrap gap-4'}`}>
                    {selectedGroup.email && (
                      <a 
                        href={`mailto:${selectedGroup.email}`}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center touch-manipulation p-2 bg-blue-900/20 rounded-lg"
                      >
                        <span className="mr-2">✉️</span> 
                        <span className={isMobile ? 'break-all' : ''}>{selectedGroup.email}</span>
                      </a>
                    )}
                    {selectedGroup.phone && (
                      <a 
                        href={`tel:${selectedGroup.phone}`}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center touch-manipulation p-2 bg-green-900/20 rounded-lg"
                      >
                        <span className="mr-2">📞</span> {selectedGroup.phone}
                      </a>
                    )}
                    {selectedGroup.website && (
                      <a 
                        href={selectedGroup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center touch-manipulation p-2 bg-purple-900/20 rounded-lg"
                      >
                        <span className="mr-2">🌐</span> Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Action buttons - Mobile full width */}
                <div className={`${isMobile ? 'space-y-3' : 'flex flex-col space-y-3 mt-4 md:mt-0'}`}>
                  <button
                    onClick={() => sendMessage(selectedGroup.id)}
                    className={`btn-primary flex items-center justify-center touch-manipulation min-h-[44px] ${
                      isMobile ? 'w-full' : ''
                    }`}
                    disabled={authLoading || (user === null && requiresLogin === false)}
                  >
                    <FaPaperPlane className="mr-2" /> Contact Group
                  </button>
                  {!isMobile && (
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="btn-secondary"
                    >
                      Close Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Groups Message - Mobile optimized */}
        {!isLoading && groups.length === 0 && (
          <div className={`absolute z-30 text-center bg-black/80 backdrop-blur-md border border-white/10 rounded-lg pointer-events-auto ${
            isMobile 
              ? 'inset-x-4 top-1/2 transform -translate-y-1/2 p-6'
              : 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full mx-auto p-12'
          }`}>
            <div className="flex justify-center mb-6">
              <div className={`rounded-full bg-[#3a3a3a] flex items-center justify-center ${
                isMobile ? 'w-16 h-16' : 'w-20 h-20'
              }`}>
                <FaInfoCircle className={`text-gray-400 ${isMobile ? 'text-xl' : 'text-2xl'}`} />
              </div>
            </div>
            <h2 className={`font-light tracking-wide mb-3 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              No Groups Found
            </h2>
            <p className="text-gray-400 mb-4">
              It looks like there aren&apos;t any groups in our database yet.
            </p>
            <p className="text-gray-500 mb-8">
              Consider {' '}
              <Link href="/groups/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                registering your own group
              </Link>.
            </p>
            <div className={`${isMobile ? 'space-y-3' : 'flex flex-col md:flex-row justify-center gap-4'}`}>
              <Link
                href="/groups/register"
                className={`btn-primary touch-manipulation min-h-[44px] ${isMobile ? 'block w-full' : 'inline-block'}`}
              >
                <FaEdit className="mr-2 inline" /> Register a Group
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Information Section - Mobile responsive */}
      <div className="relative z-10 bg-[#292929]/80 py-12 sm:py-20">
        <div className="container mx-auto mobile-container">
          <div className="mobile-grid">
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 sm:p-8 rounded-sm">
              <h3 className="text-xl sm:text-2xl font-light mb-4">Why Join a Group?</h3>
              <p className="text-gray-300 mb-6 mobile-text">
                Connecting with others who share similar experiences can provide invaluable support, validation, and practical guidance through life&apos;s numerous challenges.
              </p>
              <ul className="space-y-2 text-gray-400 mobile-text">
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1 flex-shrink-0">•</div>
                  <span>Find understanding among those with similar experiences</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1 flex-shrink-0">•</div>
                  <span>Exchange practical advice and coping strategies</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1 flex-shrink-0">•</div>
                  <span>Build a network of support beyond professional services</span>
                </li>
                <li className="flex items-start">
                  <div className="text-blue-400 mr-2 mt-1 flex-shrink-0">•</div>
                  <span>Reduce feelings of isolation and loneliness</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 sm:p-8 rounded-sm">
              <h3 className="text-xl sm:text-2xl font-light mb-4">Start Your Own Group</h3>
              <p className="text-gray-300 mb-6 mobile-text">
                Don&apos;t see a group that meets your specific needs? Consider starting your own and creating the supportive community you&apos;re looking for.
              </p>
              <p className="text-gray-400 mb-6 mobile-text">
                Our platform makes it easy to register and manage your group, connect with members, and grow your community.
              </p>
              <Link 
                href="/groups/register" 
                className="btn-primary mobile-button touch-manipulation min-h-[44px] inline-flex items-center"
              >
                <FaEdit className="mr-2" /> Register a New Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
