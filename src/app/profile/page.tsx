'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { FaUser, FaCamera, FaSignOutAlt, FaEdit } from 'react-icons/fa'

interface ProfileFormData {
  username: string;
  full_name: string;
  bio: string;
  location: string;
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, initialize, refreshProfile, signOut } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    full_name: '',
    bio: '',
    location: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/api/auth/login')
      return
    }
    
    // Initialize form with profile data
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
      })
      
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url)
      }
    }
  }, [user, profile, loading, router])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Preview the image
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setAvatarPreview(result)
      }
    }
    reader.readAsDataURL(file)
    
    setAvatarFile(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      if (!user) throw new Error('User not authenticated')
      
      console.log('User:', user);
      console.log('Supabase session:', supabase.auth.getSession && await supabase.auth.getSession());
      
      // Update avatar if changed
      let avatar_url = profile?.avatar_url || null
      
      if (avatarFile) {
        // Create 'avatars' bucket if it doesn't exist
        try {
          // Check if bucket exists first
          const { error: getBucketError } = await supabase.storage.getBucket('avatars')

          if (getBucketError) {
            // Create the bucket if it doesn't exist
            await supabase.storage.createBucket('avatars', {
              public: true
            })
          }
        } catch (err) {
          console.error('Error with bucket:', err)
          // Continue anyway, it might already exist
        }
        
        // Upload the avatar
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}-${Date.now()}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)
        
        console.log('Upload result:', { data, error });
        
        if (error) throw error
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        
        avatar_url = publicUrlData.publicUrl
      }
      
      // Check if profile row exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found
        throw fetchError;
      }

      if (!existingProfile) {
        // Insert a new profile row if it doesn't exist
        const insertResponse = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: formData.username,
            full_name: formData.full_name,
            bio: formData.bio,
            location: formData.location,
            avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        console.log('Insert response:', insertResponse);
        if (insertResponse.error) setError(insertResponse.error.message);
      } else {
        // Update the existing profile row
        const updateResponse = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            full_name: formData.full_name,
            bio: formData.bio,
            location: formData.location,
            avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        console.log('Update response:', updateResponse);
        if (updateResponse.error) setError(updateResponse.error.message);
      }
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Refresh auth store profile data
      refreshProfile()
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'There was an error updating your profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
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
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gray-100 p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {avatarPreview ? (
                  <Image 
                    src={avatarPreview}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-4xl" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer"
                >
                  <FaCamera />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-600">
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px", padding: "5px"}}
                    placeholder="Your Name"
                    className="block w-full md:w-1/2 rounded-md border-gray-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                  />
                ) : (
                  profile?.full_name || 'Your Name'
                )}
              </h2>
              
              <p className="text-gray-600">
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px", padding: "5px"}}
                    placeholder="username"
                    className="block w-full md:w-1/2 rounded-md border-gray-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  `@${profile?.username || 'username'}`
                )}
              </p>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Cancel' : (
                    <>
                      <FaEdit className="mr-2" /> Edit Profile
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaSignOutAlt className="mr-2" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6">
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
          
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  style={{backgroundColor: "#fff ", color: "#4b5563", borderColor: "#000", borderWidth: "1px", padding: "5px"}}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  style={{backgroundColor: "#fff !important ", color: "#4b5563", borderColor: "#000", borderWidth: "1px", padding: "5px"}}
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  className="block w-full md:w-1/2 rounded-md border-gray-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p style={{backgroundColor: "#aaa ", borderRadius: "5px",
                  color: "#4b5563", borderColor: "#000", borderWidth: "1px", padding: "5px"}} className="text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">*Email cannot be changed</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-600">
                  {profile?.bio || 'No bio added yet.'}
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">
                  {profile?.location || 'No location specified.'}
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email Address</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}