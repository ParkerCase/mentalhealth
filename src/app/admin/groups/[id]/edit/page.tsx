// src/app/admin/groups/[id]/edit/page.tsx
'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { GroupFormData, Group } from '@/lib/types'
import { geocodeAddress } from '@/lib/utils/geocodingService'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

export default function EditGroup() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    email: '',
    phone: '',
  })
  const [approved, setApproved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchGroup = async () => {
      if (!params.id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', params.id)
          .single()
        
        if (error) throw error
        
        if (data) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            location: data.location || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
          })
          setApproved(data.approved || false)
        }
      } catch (error) {
        console.error('Error fetching group:', error)
        setError('Failed to load group data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroup()
  }, [params.id])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (!params.id) {
        throw new Error('Group ID is missing')
      }

      // Update the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description || null,
          location: formData.location || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          website: formData.website || null,
          email: formData.email || null,
          phone: formData.phone || null,
          approved: approved,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single() as { data: Group | null; error: Error | null }

      if (groupError) {
        throw new Error(groupError.message || 'Failed to update group')
      }

      // Try to geocode and update location if address is provided
      if (group && formData.address && formData.city && formData.state) {
        try {
          const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip || ''}`
          const results = await geocodeAddress(fullAddress)
          
          if (results && results.length > 0) {
            const { lng, lat } = results[0]
            // Update with geo_location using PostGIS format
            const { error: geoError } = await supabase.rpc('update_group_location', {
              group_id: group.id,
              lng: lng,
              lat: lat
            })
            
            if (geoError) {
              console.error('Geocoding update error:', geoError)
            }
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError)
          // Don't fail the whole operation if geocoding fails
        }
      }

      setSuccess('Group updated successfully!')
      setTimeout(() => {
        router.push(`/admin/groups/${params.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error updating group:', error)
      setError(error.message || 'There was an error updating the group. Please try again.')
    } finally {
      setIsSubmitting(false)
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href={`/admin/groups/${params.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Group Details
        </Link>
        <h1 className="text-3xl font-bold">Edit Group</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Approved</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href={`/admin/groups/${params.id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !!success}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {success ? 'Submitted' : isSubmitting ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
