// src/app/locator/page.tsx
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FaSearch, FaMapMarkerAlt, FaUserCircle, FaInfo } from 'react-icons/fa'
import dynamic from 'next/dynamic'
import { Group, GroupSearchParams } from '@/lib/types'

// Dynamically import LocationMap component with no SSR
const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-md">
      <div className="text-gray-500">Loading map...</div>
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
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-md">
        <div className="text-gray-500">Unable to load map.</div>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Groups Near You</h1>
      
      {requiresLogin && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be logged in to search for groups. {' '}
                <Link href="/api/auth/login" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                  Login
                </Link> or {' '}
                <Link href="/api/auth/register" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                  Register
                </Link> to continue.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Search Filters</h2>
            <form onSubmit={handleSearch}>
              <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={searchParams.city}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter city name"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={searchParams.state}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter state"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={searchParams.keywords}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search by name or description"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSearching || loading}
                className="w-full flex justify-center items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSearching ? (
                  'Searching...'
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Search Groups
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-2">
          {searchPerformed ? (
            groups.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-md shadow">
                  <Suspense fallback={
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-md">
                      <div className="text-gray-500">Loading map...</div>
                    </div>
                  }>
                    <ErrorBoundary>
                      <LocationMap groups={groups} />
                    </ErrorBoundary>
                  </Suspense>
                </div>
                
                <h2 className="text-xl font-semibold">Found {groups.length} groups</h2>
                
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-white shadow-md rounded-lg p-6">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                          <p className="text-gray-600 mb-4 text-sm flex items-center">
                            <FaMapMarkerAlt className="mr-1" /> 
                            {[group.city, group.state].filter(Boolean).join(', ')}
                          </p>
                          <p className="text-gray-700 mb-4">
                            {group.description?.length && group.description.length > 150
                              ? `${group.description.substring(0, 150)}...`
                              : group.description}
                          </p>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                          <button
                            onClick={() => sendMessage(group.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Contact Group
                          </button>
                          
                          <button
                            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                          >
                            <FaInfo className="mr-2" /> View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <div className="mb-4">
                  <FaSearch className="mx-auto text-gray-400 text-5xl" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No groups found</h2>
                <p className="text-gray-600 mb-4">
                  We couldn't find any groups matching your search criteria. Try adjusting your filters or consider registering a new group.
                </p>
                <Link
                  href="/groups/register"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register a Group
                </Link>
              </div>
            )
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <div className="mb-4">
                <FaUserCircle className="mx-auto text-gray-400 text-5xl" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Find Your Community</h2>
              <p className="text-gray-600 mb-4">
                Use the search filters to find support groups and communities in your area. 
                You can search by location and keywords to find the perfect match for your needs.
              </p>
              <p className="text-gray-600">
                Don't see what you're looking for? Consider {' '}
                <Link href="/groups/register" className="text-blue-600 hover:underline">
                  registering your own group
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}