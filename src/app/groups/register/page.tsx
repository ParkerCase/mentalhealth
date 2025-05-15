// src/app/groups/register/page.tsx
'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GroupFormData, Group } from '@/lib/types'

interface ExtendedGroupFormData extends GroupFormData {
  leaderFirstName: string;
  leaderLastName: string;
  leaderEmail: string;
  leaderPhone: string;
  agreeToTerms: boolean;
}

export default function RegisterGroup() {
  const router = useRouter()
  const { user, profile, loading } = useAuthStore()
  const [formData, setFormData] = useState<ExtendedGroupFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    email: '',
    phone: '',
    leaderFirstName: '',
    leaderLastName: '',
    leaderEmail: '',
    leaderPhone: '',
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions')
      setIsSubmitting(false)
      return
    }

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
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
        .single() as { data: Group | null; error: Error | null }

      if (groupError) throw groupError

      // If the user is logged in, add them as a leader
      if (user && group) {
        const { error: leaderError } = await supabase
          .from('group_leaders')
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'founder'
          })
        
        if (leaderError) throw leaderError
      }

      // Store leader info in separate metadata table or send email to admin
      // In a real app, you might want to store this in another table

      setSuccess('Your group has been submitted for approval. You will be notified once it is approved.')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        website: '',
        email: '',
        phone: '',
        leaderFirstName: '',
        leaderLastName: '',
        leaderEmail: '',
        leaderPhone: '',
        agreeToTerms: false
      } as ExtendedGroupFormData)
    } catch (error) {
      console.error('Error registering group:', error)
      setError('There was an error submitting your group. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loginPrompt = !user && !loading && (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You're not logged in. <Link href="/api/auth/login" className="font-medium underline text-yellow-700 hover:text-yellow-600">Login</Link> or <Link href="/api/auth/register" className="font-medium underline text-yellow-700 hover:text-yellow-600">Register</Link> to manage your group after submission.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1  className="text-3xl font-bold mb-6">Register Your Group</h1>
      
      <div style={{color: "#374151"}} className="bg-white shadow-md rounded-lg p-6 mb-8">
        <p className="mb-4">
          Thank you for your interest in registering your group with our platform. By registering, 
          you'll help others find the support they need in their community.
        </p>
        <p className="mb-4">
          All submissions will be reviewed by our team before being published. This process typically 
          takes 1-2 business days.
        </p>
        <h2 style={{color: "#374151"}} className="text-xl font-semibold mb-3">Guidelines:</h2>
        <ul className="list-disc pl-5 mb-4">
          <li className="mb-2">Provide accurate and up-to-date information about your group</li>
          <li className="mb-2">Include clear contact information for interested individuals</li>
          <li className="mb-2">Be specific about the type of support or activities your group offers</li>
          <li className="mb-2">Ensure your group follows all applicable laws and regulations</li>
        </ul>
      </div>
      
      {loginPrompt}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <h2 style={{color: "#374151"}} className="text-xl font-semibold mb-4">Group Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name*
              </label>
              <input
              style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description*
              </label>
              <textarea
              style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Describe what your group does, who it serves, and what support or activities you offer..."
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
              style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
              style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Group Email*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Group Phone Number
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {!user && (
          <div className="mb-6">
            <h2 style={{color: "#374151"}} className="text-xl font-semibold mb-4">Group Leader Information</h2>
            <p className="mb-4 text-sm text-gray-500">
              Since you're not logged in, please provide your contact information as the group leader.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="leaderFirstName" className="block text-sm font-medium text-gray-700">
                  First Name*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="text"
                  id="leaderFirstName"
                  name="leaderFirstName"
                  value={formData.leaderFirstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="leaderLastName" className="block text-sm font-medium text-gray-700">
                  Last Name*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="text"
                  id="leaderLastName"
                  name="leaderLastName"
                  value={formData.leaderLastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="leaderEmail" className="block text-sm font-medium text-gray-700">
                  Email*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="email"
                  id="leaderEmail"
                  name="leaderEmail"
                  value={formData.leaderEmail}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="leaderPhone" className="block text-sm font-medium text-gray-700">
                  Phone Number*
                </label>
                <input
                style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px"}}
                  type="tel"
                  id="leaderPhone"
                  name="leaderPhone"
                  value={formData.leaderPhone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
              style={{backgroundColor: "#fff", color: "#fff"}}
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                I agree to the Terms of Service and Privacy Policy
              </label>
              <p className="text-gray-500">
                By registering your group, you agree to our {' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and {' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Group for Approval'}
          </button>
        </div>
      </form>
    </div>
  )
}