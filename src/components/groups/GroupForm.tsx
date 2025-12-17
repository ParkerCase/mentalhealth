'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { GroupFormData } from '@/lib/types'
import { geocodeAddress } from '@/lib/utils/geocodingService'

interface GroupFormProps {
  onSuccess?: () => void
}

export default function GroupForm({ onSuccess }: GroupFormProps) {
  const router = useRouter()
  const { user } = useAuthStore()
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (!user) {
        throw new Error('You must be logged in to register a group')
      }

      // Insert the group first without geo_location to avoid PostGIS parsing issues
      // We'll update the location separately if geocoding succeeds
      const { data, error: insertError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          location: formData.location,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          approved: false // Requires admin approval
        })
        .select()
      
      if (insertError) throw insertError

      // Try to geocode and update location if address is provided
      if (data && data.length > 0 && formData.address && formData.city && formData.state) {
        try {
          const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`
          const results = await geocodeAddress(fullAddress)
          
          if (results && results.length > 0) {
            const { lng, lat } = results[0]
            // Try to update with geo_location using GeoJSON format
            // If this fails, the group is still created, just without coordinates
            try {
              await supabase
                .from('groups')
                .update({
                  geo_location: {
                    type: 'Point',
                    coordinates: [lng, lat]
                  }
                })
                .eq('id', data[0].id)
            } catch (geoUpdateError) {
              console.warn('Could not update geo_location, but group was created:', geoUpdateError)
              // Group is still created successfully, just without coordinates
            }
          }
        } catch (geoError) {
          console.warn('Geocoding error (group still created):', geoError)
          // Continue - group is created, just without geocoding
        }
      }

      setSuccess(true)
      
      // Reset form
      setFormData({
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
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Group registration error:', error)
      setError(error.message || 'Group registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <div className="flex flex-col items-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Group Registration Successful!</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Thank you for registering your group. Your submission will be reviewed by our administrators. 
                We'll reach out to you with next steps soon.
              </p>
            </div>
            <div className="mt-5 flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFormData({
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
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Register Another Group
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Register Your Group</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Fill out the form below to register your support group or organization.
        </p>
      </div>

      {error && (
        <div className="mx-4 my-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Group/Organization Name*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description*
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Please describe your group, its mission, and the people you serve"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              General Location*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="location"
                id="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="e.g. Downtown Chicago, South Phoenix, etc."
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="city"
                id="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="state"
                id="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
              ZIP Code*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="zip"
                id="zip"
                required
                value={formData.zip}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <div className="mt-1">
              <input
                type="url"
                name="website"
                id="website"
                value={formData.website}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email*
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}