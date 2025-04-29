'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import GlobeComponent from '@/components/globe/Globe'
import Link from 'next/link'
import { FaUsers, FaComments, FaMapMarkerAlt } from 'react-icons/fa'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, initialize } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<{
    groups: any[];
    recentMessages: any[];
    nearbyGroups: any[];
  }>({
    groups: [],
    recentMessages: [],
    nearbyGroups: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/api/auth/login')
      return
    }
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch user's groups
        const { data: groups } = await supabase
          .from('groups')
          .select('*')
          .limit(5)
        
        // Fetch recent messages
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        // Fetch nearby groups if location is available
        let nearbyGroups = []
        if (profile?.location) {
          const { data } = await supabase
            .from('groups')
            .select('*')
            .limit(3)
          
          nearbyGroups = data || []
        }
        
        setDashboardData({
          groups: groups || [],
          recentMessages: messages || [],
          nearbyGroups: nearbyGroups
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [user, profile, loading, router, supabase])

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Welcome, {profile?.full_name || user?.email}</h2>
              <p className="text-gray-600">Here's what's happening in your support network.</p>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/groups" className="flex flex-col items-center justify-center bg-white shadow-md rounded-lg p-6 transition duration-200 hover:shadow-lg">
              <FaUsers className="text-3xl text-blue-500 mb-3" />
              <h3 className="text-lg font-medium">Find Groups</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Connect with supportive communities</p>
            </Link>
            
            <Link href="/messages" className="flex flex-col items-center justify-center bg-white shadow-md rounded-lg p-6 transition duration-200 hover:shadow-lg">
              <FaComments className="text-3xl text-green-500 mb-3" />
              <h3 className="text-lg font-medium">Messages</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Chat with your support network</p>
            </Link>
            
            <Link href="/locator" className="flex flex-col items-center justify-center bg-white shadow-md rounded-lg p-6 transition duration-200 hover:shadow-lg">
              <FaMapMarkerAlt className="text-3xl text-red-500 mb-3" />
              <h3 className="text-lg font-medium">Resource Locator</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Find local support resources</p>
            </Link>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              
              {dashboardData.recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentMessages.map((message) => (
                    <div key={message.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between">
                        <p className="font-medium">{message.sender_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent activity to show.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Globe Visualization */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium">Mental Health Support Globally</h3>
            </div>
            <div className="h-[300px] w-full">
              <GlobeComponent 
                height="300px" 
                width="100%" 
                groups={dashboardData.groups}
                initialCoordinates={profile?.location ? {
                  lat: parseFloat(profile.location.split(',')[0] || '0'),
                  lng: parseFloat(profile.location.split(',')[1] || '0')
                } : undefined}
              />
            </div>
          </div>
          
          {/* Your Groups */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium">Your Groups</h3>
            </div>
            <div className="p-4">
              {dashboardData.groups.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.groups.map((group) => (
                    <Link 
                      href={`/groups/${group.id}`} 
                      key={group.id}
                      className="block p-3 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{group.members_count || 0} members</div>
                    </Link>
                  ))}
                  <div className="pt-2 border-t">
                    <Link href="/groups" className="text-blue-600 text-sm font-medium hover:underline">
                      View all groups →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-gray-500 mb-3">You're not a member of any groups yet.</p>
                  <Link href="/groups" className="text-blue-600 text-sm font-medium hover:underline">
                    Discover groups →
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Nearby Support */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium">Nearby Support</h3>
            </div>
            <div className="p-4">
              {dashboardData.nearbyGroups.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.nearbyGroups.map((group) => (
                    <Link 
                      href={`/groups/${group.id}`} 
                      key={group.id}
                      className="block p-3 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{group.location || 'Location not specified'}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-gray-500">
                    {profile?.location 
                      ? 'No nearby groups found.' 
                      : 'Add your location in profile settings to see nearby support groups.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}