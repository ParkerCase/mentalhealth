// src/app/admin/groups/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaCheck, FaTimes, FaSearch, FaFilter, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { Group } from '@/lib/types'

export default function AdminGroups() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'approved', 'pending'
  
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true)
      try {
        // Fetch ALL groups (including unapproved) - admin should see everything
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching groups:', error)
          throw error
        }
        
        console.log('Fetched groups:', data?.length || 0, 'groups')
        setGroups(data || [])
        setFilteredGroups(data || [])
      } catch (error) {
        console.error('Error fetching groups:', error)
        alert('Error loading groups. Please check the console and ensure RLS policies are set correctly.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroups()
    
    // Set up real-time subscription for new groups
    const groupsChannel = supabase
      .channel('admin-groups-changes')
      .on('postgres_changes', {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'groups'
      }, (payload) => {
        console.log('Groups table changed:', payload)
        // Refetch groups when any change occurs
        fetchGroups()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(groupsChannel)
    }
  }, [])
  
  useEffect(() => {
    // Apply filters when search term or status filter changes
    let filtered = [...groups]
    
    // Apply status filter
    if (statusFilter === 'approved') {
      filtered = filtered.filter(group => group.approved)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(group => !group.approved)
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(term) ||
        group.description?.toLowerCase().includes(term) ||
        group.city?.toLowerCase().includes(term) ||
        group.state?.toLowerCase().includes(term)
      )
    }
    
    setFilteredGroups(filtered)
  }, [groups, searchTerm, statusFilter])
  
  const handleApprove = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ approved: true })
        .eq('id', groupId)
      
      if (error) throw error
      
      // Update local state
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId ? { ...group, approved: true } : group
        )
      )
    } catch (error) {
      console.error('Error approving group:', error)
    }
  }
  
  const handleReject = async (groupId: string) => {
    if (!confirm('Are you sure you want to reject/delete this group?')) return
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
      
      if (error) throw error
      
      // Update local state
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId))
      alert('Group deleted successfully')
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Error deleting group. Please try again.')
    }
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to permanently delete this group? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
      
      if (error) throw error
      
      // Update local state
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId))
      alert('Group deleted successfully')
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Error deleting group. Please try again.')
    }
  }

  const handleUnapprove = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ approved: false })
        .eq('id', groupId)
      
      if (error) {
        console.error('Error unapproving group:', error)
        alert(`Error unapproving group: ${error.message}`)
        return
      }
      
      // Update local state
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId ? { ...group, approved: false } : group
        )
      )
      alert('Group unapproved successfully')
    } catch (error: any) {
      console.error('Error unapproving group:', error)
      alert(`Error unapproving group: ${error.message || 'Unknown error'}`)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Groups</h1>
        <button
          onClick={() => router.push('/admin/groups/create')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          <span>Create New Group</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="relative mb-4 md:mb-0 md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 py-2 pr-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 flex items-center text-sm text-gray-600">
              <FaFilter className="mr-1" /> Filter:
            </span>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Groups</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Groups list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredGroups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/admin/groups/${group.id}`}>
                          {group.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{`${group.city || ''}, ${group.state || ''}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{group.email || 'N/A'}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/admin/groups/${group.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          View
                        </Link>
                        
                        <Link
                          href={`/admin/groups/${group.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Group"
                        >
                          <FaEdit />
                        </Link>
                        
                        {group.approved ? (
                          <button
                            onClick={() => handleUnapprove(group.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Unapprove Group"
                          >
                            <FaTimes />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(group.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Group"
                          >
                            <FaCheck />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Group"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No groups found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}