// src/app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FaUsers, FaUserFriends, FaComments, FaClipboardList } from 'react-icons/fa'
import Link from 'next/link'
import { Group } from '@/lib/types'

interface AdminStats {
  totalGroups: number;
  pendingGroups: number;
  totalUsers: number;
  totalMessages: number;
  totalContacts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalGroups: 0,
    pendingGroups: 0,
    totalUsers: 0,
    totalMessages: 0,
    totalContacts: 0
  })
  const [recentGroups, setRecentGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch groups stats
        const { count: totalGroups } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
        
        const { count: pendingGroups } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false)
        
        // Fetch users count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        // Fetch messages count
        const { count: totalMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
        
        // Fetch contact submissions count
        const { count: totalContacts } = await supabase
          .from('contact_submissions')
          .select('*', { count: 'exact', head: true })
        
        setStats({
          totalGroups: totalGroups || 0,
          pendingGroups: pendingGroups || 0,
          totalUsers: totalUsers || 0,
          totalMessages: totalMessages || 0,
          totalContacts: totalContacts || 0
        })
        
        // Fetch recent groups
        const { data: recentGroupsData } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        setRecentGroups(recentGroupsData || [])
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [supabase])
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Groups</p>
              <h3 className="text-2xl font-bold">{stats.totalGroups}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <FaClipboardList className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Pending Approvals</p>
              <h3 className="text-2xl font-bold">{stats.pendingGroups}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <FaUserFriends className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <FaComments className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Messages</p>
              <h3 className="text-2xl font-bold">{stats.totalMessages}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent groups */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Group Registrations</h2>
        {recentGroups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{`${group.city || ''}, ${group.state || ''}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        group.approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {group.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <Link href={`/admin/groups/${group.id}`}>View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent group registrations.</p>
        )}
      </div>
      
      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/groups?filter=pending" 
            className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium py-3 px-4 rounded-md flex items-center justify-center"
          >
            Review Pending Groups
          </Link>
          <Link 
            href="/admin/content/create" 
            className="bg-green-50 hover:bg-green-100 text-green-800 font-medium py-3 px-4 rounded-md flex items-center justify-center"
          >
            Create New Content
          </Link>
          <Link 
            href="/admin/messages" 
            className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium py-3 px-4 rounded-md flex items-center justify-center"
          >
            View Support Messages
          </Link>
        </div>
      </div>
    </div>
  )
}