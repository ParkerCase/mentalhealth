// src/app/locator/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FaInfoCircle, FaSlack, FaPaperPlane, FaEdit } from 'react-icons/fa'
import { Group, GroupSearchParams } from '@/lib/types'
import { GeocodingResult } from '@/lib/utils/geocodingService'
import GlobeWithSearch from '@/components/globe/GlobeWithSearch'

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
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
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
  
  const handleSearch = useCallback(async (params?: GroupSearchParams) => {
    // Use provided params or the current state
    const searchCriteria = params || searchParams
    
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
      if (searchCriteria.city) {
        query = query.ilike('city', `%${searchCriteria.city}%`)
      }
      
      if (searchCriteria.state) {
        query = query.ilike('state', `%${searchCriteria.state}%`)
      }
      
      if (searchCriteria.keywords) {
        query = query.or(`name.ilike.%${searchCriteria.keywords}%,description.ilike.%${searchCriteria.keywords}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setGroups(data || [])
    } catch (error) {
      console.error('Error searching groups:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchParams, user, loading, supabase])
  
  const handleLocationSelect = (location: GeocodingResult) => {
    setSelectedLocation(location)
    
    // Update search criteria with the location info
    if (location.address) {
      setSearchParams(prev => ({
        ...prev,
        city: location.address?.city || prev.city,
        state: location.address?.state || prev.state,
      }))
    }
  }
  
  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group)
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
  
  // Add this effect to update groups in real-time when they change
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to group changes (new groups being approved)
    const groupsSubscription = supabase
      .channel('public:groups')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'groups',
        filter: 'approved=eq.true'
      }, () => {
        // Refresh the groups when changes occur
        handleSearch();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(groupsSubscription);
    };
  }, [supabase, handleSearch, user]);

  const transformGroupsForGlobe = (groups: Group[]): Array<{
  id: string;
  name: string;
  description?: string | null;
  geo_location?: {
    type?: string;
    coordinates: number[];
  };
  city?: string;
  state?: string;
  address?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
}> => {
  return groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    geo_location: group.geo_location ? {
      type: group.geo_location.type,
      coordinates: group.geo_location.coordinates as number[]
    } : undefined,
    city: group.city || undefined,
    state: group.state || undefined,
    address: group.address || undefined,
    zip: group.zip || undefined,
    phone: group.phone || undefined,
    email: group.email || undefined,
    website: group.website || undefined
  }));
};
  
  return (
    <div className="min-h-screen bg-[#292929] relative">
      {/* Login notification panel */}
      {requiresLogin && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#4A3E33] border-l-2 border-[#FFD700] p-4 rounded-sm backdrop-blur-sm shadow-lg w-full max-w-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="text-[#FFD700] mt-1" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-white/80">
                You need to be logged in to search for groups. {' '}
                <Link href="/api/auth/login?redirectUrl=/locator" className="text-blue-400 hover:text-blue-300 underline">
                  Login
                </Link> or {' '}
                <Link href="/api/auth/register?redirectUrl=/locator" className="text-blue-400 hover:text-blue-300 underline">
                  Register
                </Link> to continue.
              </p>
              <button 
                className="mt-2 text-xs text-gray-300 hover:text-white"
                onClick={() => setRequiresLogin(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-12 pt-24">
        <h1 className="text-5xl font-light tracking-wide mb-6 text-white">
          <span className="font-normal">Find</span> Groups
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl">
          Discover support groups and communities in your area. Connect with others on similar journeys.
        </p>
      </div>
      
      {/* Main Globe Visualization with Search */}
      <div className="container mx-auto px-4 pb-12">
        <GlobeWithSearch 
groups={transformGroupsForGlobe(groups)}
  onGroupSelect={handleGroupSelect}
  onSearchSubmit={handleSearch}
  initialCoordinates={selectedLocation ? 
    { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
    undefined
  }
  height="70vh"
  width="100%"
        />
        
        {/* Selected Group Details */}
        {selectedGroup && (
          <div className="mt-8 bg-black/60 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="mb-6 md:mb-0 md:max-w-2xl">
                <h2 className="text-2xl font-light text-white mb-3">{selectedGroup.name}</h2>
                
                <div className="text-gray-400 mb-4 text-sm">
                  {[selectedGroup.address, selectedGroup.city, selectedGroup.state, selectedGroup.zip]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                
                <div className="text-gray-300 mb-6">
                  {selectedGroup.description}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {selectedGroup.email && (
                    <a 
                      href={`mailto:${selectedGroup.email}`}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    >
                      <span className="mr-1">✉️</span> {selectedGroup.email}
                    </a>
                  )}
                  
                  {selectedGroup.phone && (
                    <a 
                      href={`tel:${selectedGroup.phone}`}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    >
                      <span className="mr-1">📞</span> {selectedGroup.phone}
                    </a>
                  )}
                  
                  {selectedGroup.website && (
                    <a 
                      href={selectedGroup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    >
                      <span className="mr-1">🌐</span> Website
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                <button
                  onClick={() => sendMessage(selectedGroup.id)}
                  className="btn-primary flex items-center justify-center"
                  disabled={!user}
                >
                  <FaPaperPlane className="mr-2" /> Contact Group
                </button>
                
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="btn-secondary"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* No search results yet message */}
        {!searchPerformed && !isSearching && groups.length === 0 && (
          <div className="mt-8 text-center p-12 bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                <FaSlack className="text-gray-400 text-2xl" />
              </div>
            </div>
            <h2 className="text-2xl font-light tracking-wide mb-3">Discover Your Community</h2>
            <p className="text-gray-400 mb-4 max-w-lg mx-auto">
              Use the search or explore the globe to find support groups and communities that meet your needs.
            </p>
            <p className="text-gray-500 mb-8">
              Don&apos;t see what you&apos;re looking for? Consider {' '}
              <Link href="/groups/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                registering your own group
              </Link>.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <button
                onClick={() => handleSearch({ city: '', state: '', keywords: '' })}
                className="btn-primary"
              >
                Show All Groups
              </button>
              
              <Link
                href="/groups/register"
                className="btn-secondary"
              >
                <FaEdit className="mr-2" /> Register a Group
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom gradient section */}
      <div className="relative z-10 bg-[#292929]/80 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-8 rounded-sm">
              <h3 className="text-2xl font-light mb-4">Why Join a Group?</h3>
              <p className="text-gray-300 mb-6">
                Connecting with others who share similar experiences can provide invaluable support, validation, and practical guidance through life&apos;s numerous challenges.
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
                Don&apos;t see a group that meets your specific needs? Consider starting your own and creating the supportive community you&apos;re looking for.
              </p>
              <p className="text-gray-400 mb-6">
                Our platform makes it easy to register and manage your group, connect with members, and grow your community.
              </p>
              <Link href="/groups/register" className="btn-primary inline-block">
                <FaEdit className="mr-2 inline" /> Register a New Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}