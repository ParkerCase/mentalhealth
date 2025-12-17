'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Group } from '@/lib/types'
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa'
import GroupCard from './GroupCard'

interface GroupSearchProps {
  onGroupSelect?: (group: Group) => void
}

export default function GroupSearch({ onGroupSelect }: GroupSearchProps) {
  const [searchParams, setSearchParams] = useState({
    city: '',
    state: '',
    keywords: ''
  })
  const [groups, setGroups] = useState<Group[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    
    // At least one search parameter is required
    if (!searchParams.city && !searchParams.state && !searchParams.keywords) {
      setError('Please enter at least one search criteria (city, state, or keywords)')
      return
    }

    setIsSearching(true)
    setError(null)
    setHasSearched(true)

    try {
      // Build the query
      let query = supabase
        .from('groups')
        .select('*')
        .eq('approved', true)

      // Apply filters
      if (searchParams.city) {
        query = query.ilike('city', `%${searchParams.city}%`)
      }

      if (searchParams.state) {
        query = query.ilike('state', `%${searchParams.state}%`)
      }

      if (searchParams.keywords) {
        // Search in name and description
        query = query.or(`name.ilike.%${searchParams.keywords}%,description.ilike.%${searchParams.keywords}%`)
      }

      const { data, error: queryError } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (queryError) {
        throw queryError
      }

      setGroups(data || [])
      
      if (!data || data.length === 0) {
        setError('No groups found matching your search criteria')
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'An error occurred while searching. Please try again.')
      setGroups([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setSearchParams({
      city: '',
      state: '',
      keywords: ''
    })
    setGroups([])
    setError(null)
    setHasSearched(false)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Search for Groups</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={searchParams.keywords}
                onChange={handleChange}
                placeholder="Group name or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                value={searchParams.city}
                onChange={handleChange}
                placeholder="Enter city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                value={searchParams.state}
                onChange={handleChange}
                placeholder="Enter state"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="mr-2" />
                  Search
                </>
              )}
            </button>

            {hasSearched && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <FaTimes className="mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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

      {hasSearched && !isSearching && groups.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Found {groups.length} group{groups.length !== 1 ? 's' : ''}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => onGroupSelect?.(group)}
              />
            ))}
          </div>
        </div>
      )}

      {hasSearched && !isSearching && groups.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-gray-600">No groups found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  )
}

