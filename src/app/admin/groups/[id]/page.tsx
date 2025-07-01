// src/app/admin/groups/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { FaCheck, FaTimes, FaEdit, FaArrowLeft, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa'
import { GroupWithLeaders } from '@/lib/types'

export default function AdminGroupDetail() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithLeaders | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    const fetchGroup = async () => {
      if (!params.id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('groups')
          .select(`
            *,
            group_leaders (
              id,
              profiles (
                id,
                username,
                full_name,
                avatar_url,
                email
              )
            )
          `)
          .eq('id', params.id)
          .single()
        
        if (error) throw error
        
        setGroup(data)
      } catch (error) {
        console.error('Error fetching group:', error)
        setError('Group not found or you do not have permission to view it.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroup()
  }, [params.id, supabase])
  
  const handleApprove = async () => {
    if (!params.id) return
    
    try {
      const { error } = await supabase
        .from('groups')
        .update({ approved: true })
        .eq('id', params.id)
      
      if (error) throw error
      
      // Update local state
      setGroup(prev => prev ? { ...prev, approved: true } : null)
    } catch (error) {
      console.error('Error approving group:', error)
    }
  }
  
  const handleReject = async () => {
    if (!params.id) return
    if (!confirm('Are you sure you want to reject this group? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', params.id)
      
      if (error) throw error
      
      // Redirect back to groups list
      router.push('/admin/groups')
    } catch (error) {
      console.error('Error rejecting group:', error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (error || !group) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-red-500">{error || 'Group not found'}</p>
        <Link href="/admin/groups" className="text-blue-600 hover:underline mt-4 inline-block">
          Return to Groups List
        </Link>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/groups" className="mr-4 text-blue-600 hover:text-blue-800">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold">Group Details</h1>
        </div>
        
        <div className="flex space-x-2">
          {!group.approved && (
            <>
              <button
                onClick={handleApprove}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <FaCheck className="mr-2" /> Approve Group
              </button>
              
              <button
                onClick={handleReject}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <FaTimes className="mr-2" /> Reject Group
              </button>
            </>
          )}
          
          <button
            onClick={() => router.push(`/admin/groups/edit/${params.id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaEdit className="mr-2" /> Edit Group
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start">
            <div className="mb-6 md:mb-0 md:mr-6 md:w-1/4">
              {group.logo_url ? (
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={group.logo_url}
                    alt={group.name}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Logo</span>
                </div>
              )}
              
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Status</h3>
                <div className="flex items-center">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    group.approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {group.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mt-4 mb-3">Registration Date</h3>
                <p className="text-gray-600">
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="md:w-3/4">
              <h2 className="text-2xl font-bold mb-4">{group.name}</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{group.description || 'No description provided.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <ul className="space-y-2">
                    {group.email && (
                      <li className="flex items-center">
                        <FaEnvelope className="text-gray-500 mr-2" />
                        <span>{group.email}</span>
                      </li>
                    )}
                    {group.phone && (
                      <li className="flex items-center">
                        <FaPhone className="text-gray-500 mr-2" />
                        <span>{group.phone}</span>
                      </li>
                    )}
                    {group.website && (
                      <li className="flex items-center">
                        <FaGlobe className="text-gray-500 mr-2" />
                        <a href={group.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {group.website}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Location</h3>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-gray-500 mr-2 mt-1" />
                    <div>
                      {group.address && <p>{group.address}</p>}
                      <p>{[group.city, group.state, group.zip].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Group Leaders</h3>
                {group.group_leaders && group.group_leaders.length > 0 ? (
                  <div className="space-y-4">
                    {group.group_leaders.map((leader) => (
                      <div key={leader.id} className="flex items-center">
                        <div className="mr-3">
                          {leader.profiles?.avatar_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={leader.profiles.avatar_url}
                                alt={leader.profiles.username || 'Leader'}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500">
                                {leader.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium">{leader.profiles?.full_name || leader.profiles?.username || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{leader.profiles?.email || 'No email available'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No leaders registered for this group.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}