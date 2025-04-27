'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FaSearch, FaMapMarkerAlt, FaInfoCircle, FaSlack } from 'react-icons/fa'
import dynamic from 'next/dynamic'
import { Group, GroupSearchParams } from '@/lib/types'

// Dynamically import LocationMap component with no SSR
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-[#292929] rounded-sm border border-white/10">
      <div className="text-gray-400 animate-pulse tracking-wider">Loading map...</div>
    </div>
  )
})

// Dynamically import the Background Globe with no SSR
const BackgroundGlobe = dynamic(() => import('@/components/map/BackgroundGlobe'), {
  ssr: false
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
      <div className="w-full h-96 flex items-center justify-center bg-[#292929] rounded-sm border border-white/10">
        <div className="text-gray-400">Unable to load map.</div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function Locator() {
  const router = useRouter()
  const { user, loading, initialize } = useAuthStore()
  const [searchParams, setSearchParams] = useState<GroupSearchParams>({
    city: '',
    state: '',
    keywords: ''
  })
  const [groups, setGroups] = useState<Group[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const supabase = createClient()
  
  // Initialize auth state
  useEffect(() => {
    initialize()
  }, [initialize])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchParams({
      ...searchParams,
      [name]: value
    })
  }
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is logged in
    if (!user && !loading) {
      setRequiresLogin(true)
      return
    }
    
    setIsSearching(true)
    setSearchPerformed(true)
    
    try {
      let query = supabase
        .from('groups')
        .select('*')
        .eq('approved', true)
      
      // Add filters
      if (searchParams.city) {
        query = query.ilike('city', `%${searchParams.city}%`)
      }
      
      if (searchParams.state) {
        query = query.ilike('state', `%${searchParams.state}%`)
      }
      
      if (searchParams.keywords) {
        query = query.or(`name.ilike.%${searchParams.keywords}%,description.ilike.%${searchParams.keywords}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setGroups(data || [])
    } catch (error) {
      console.error('Error searching groups:', error)
    } finally {
      setIsSearching(false)
    }
  }
  
  const handleLocationSelect = (location: { lat: number; lng: number; name?: string }) => {
    if (location.name) {
      setSearchParams(prev => ({
        ...prev,
        city: location.name || prev.city,
      }))
    }
  }
  
  const sendMessage = async (groupId: string) => {
    if (!user) {
      setRequiresLogin(true)
      return
    }
    
    // Check if a conversation already exists
    const { data: existingConversation, error: queryError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
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
        user_id: user.id,
        group_id: groupId
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating conversation:', error)
      return
    }
    
    router.push(`/messages/${newConversation.id}`)
  }
  
  return (
    <div className="relative min-h-screen">
      {/* Background Globe */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <BackgroundGlobe onLocationSelect={handleLocationSelect} />
      </div>
      
      {/* Content with gradient overlay */}
      <div className="relative z-10">
        <div className="min-h-[50vh] bg-gradient-to-b from-transparent to-[#292929]">
          <div className="container mx-auto px-6 py-16 pt-32">
            <h1 className="text-5xl font-light tracking-wide mb-12 text-white"><span className="font-normal">Find</span> Groups</h1>
            
            {requiresLogin && (
              <div className="bg-[#4A3E33] border-l-2 border-[#FFD700] p-4 mb-8 rounded-sm backdrop-blur-sm bg-opacity-80">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaInfoCircle className="text-[#FFD700] mt-1" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-white/80">
                      You need to be logged in to search for groups. {' '}
                      <Link href="/api/auth/login" className="text-blue-400 hover:text-blue-300 underline">
                        Login
                      </Link> or {' '}
                      <Link href="/api/auth/register" className="text-blue-400 hover:text-blue-300 underline">
                        Register
                      </Link> to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="card border border-white/5 backdrop-blur-md bg-black/40">
                  <h2 className="text-xl font-light tracking-wide mb-6">Search Filters</h2>
                  <form onSubmit={handleSearch}>
                    <div className="mb-6">
                      <label htmlFor="city" className="form-label">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={searchParams.city}
                        onChange={handleChange}
                        className="form-input bg-[#3a3a3a]"
                        placeholder="Enter city name"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="state" className="form-label">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={searchParams.state}
                        onChange={handleChange}
                        className="form-input bg-[#3a3a3a]"
                        placeholder="Enter state"
                      />
                    </div>
                    
                    <div className="mb-8">
                      <label htmlFor="keywords" className="form-label">
                        Keywords
                      </label>
                      <input
                        type="text"
                        id="keywords"
                        name="keywords"
                        value={searchParams.keywords}
                        onChange={handleChange}
                        className="form-input bg-[#3a3a3a]"
                        placeholder="Search by name or description"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSearching || loading}
                      className="btn-primary w-full"
                    >
                      {isSearching ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FaSearch className="mr-2" />
                          Search Groups
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              
              <div className="md:col-span-2">
                {searchPerformed ? (
                  groups.length > 0 ? (
                    <div className="space-y-8">
                      <div className="card border border-white/5 backdrop-blur-md bg-black/40 p-0 overflow-hidden">
                        <Suspense fallback={
                          <div className="w-full h-96 flex items-center justify-center bg-[#292929]">
                            <div className="text-gray-400 animate-pulse tracking-wider">Loading map...</div>
                          </div>
                        }>
                          <ErrorBoundary>
                            <LocationMap groups={groups} />
                          </ErrorBoundary>
                        </Suspense>
                      </div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-light tracking-wide">Found <span className="font-normal">{groups.length}</span> groups</h2>
                        
                        <div className="text-sm text-gray-400">
                          Showing all results
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {groups.map((group) => (
                          <div key={group.id} className="card border border-white/5 backdrop-blur-md bg-black/40 hover:border-white/10 transition-all">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                              <div>
                                <h3 className="text-xl font-light tracking-wide mb-2">{group.name}</h3>
                                <p className="text-gray-400 mb-4 text-xs flex items-center">
                                  <FaMapMarkerAlt className="mr-1 text-gray-500" /> 
                                  {[group.city, group.state].filter(Boolean).join(', ')}
                                </p>
                                <p className="text-gray-300 mb-6 text-sm font-light">
                                  {group.description?.length && group.description.length > 150
                                    ? `${group.description.substring(0, 150)}...`
                                    : group.description}
                                </p>
                              </div>
                              
                              <div className="mt-4 md:mt-0 flex flex-col space-y-3">
                                <button
                                  onClick={() => sendMessage(group.id)}
                                  className="btn-primary"
                                >
                                  Contact Group
                                </button>
                                
                                <button
                                  className="btn-secondary"
                                >
                                  <FaInfoCircle className="mr-2" /> View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="card border border-white/5 backdrop-blur-md bg-black/40 text-center p-12">
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                          <FaSearch className="text-gray-400 text-2xl" />
                        </div>
                      </div>
                      <h2 className="text-xl font-light tracking-wide mb-3">No groups found</h2>
                      <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        We couldn't find any groups matching your search criteria. Try adjusting your filters or consider registering a new group.
                      </p>
                      <Link
                        href="/groups/register"
                        className="btn-primary inline-block"
                      >
                        Register a Group
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="card border border-white/5 backdrop-blur-md bg-black/40 text-center p-12">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                        <FaSlack className="text-gray-400 text-2xl" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-light tracking-wide mb-3">Find Your Community</h2>
                    <p className="text-gray-400 mb-4 max-w-lg mx-auto">
                      Use the search filters to find support groups and communities in your area. 
                      You can search by location and keywords to find the perfect match for your needs.
                    </p>
                    <p className="text-gray-500 mb-8">
                      Don't see what you're looking for? Consider {' '}
                      <Link href="/groups/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                        registering your own group
                      </Link>
                      .
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <button
                        onClick={handleSearch}
                        className="btn-primary"
                      >
                        Show All Groups
                      </button>
                      
                      <Link
                        href="/groups/register"
                        className="btn-secondary"
                      >
                        Register a Group
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom gradient section */}
        <div className="bg-[#292929] py-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
                <h3 className="text-2xl font-light mb-4">Why Join a Group?</h3>
                <p className="text-gray-300 mb-6">
                  Connecting with others who share similar experiences can provide invaluable support, validation, and practical guidance through life's challenges.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <div className="text-blue-400 mr-2 mt-1">•</div>
                    <span>Find understanding among those with similar experiences</span>
                  </li>
                  <li className="flex items-start">
                    <div className="text-blue-400 mr-2 mt-1">•</div>
                    <span>Exchange practical advice and coping strategies</span>
                  </li>
                  <li className="flex items-start">
                    <div className="text-blue-400 mr-2 mt-1">•</div>
                    <span>Build a network of support beyond professional services</span>
                  </li>
                  <li className="flex items-start">
                    <div className="text-blue-400 mr-2 mt-1">•</div>
                    <span>Reduce feelings of isolation and loneliness</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
                <h3 className="text-2xl font-light mb-4">Start Your Own Group</h3>
                <p className="text-gray-300 mb-6">
                  Don't see a group that meets your specific needs? Consider starting your own and creating the supportive community you're looking for.
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
        </div>
      </div>
    </div>
  )
}