// src/components/globe/GlobeWithSearch.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FaSpinner, FaList, FaGlobe, FaFilter, FaMapMarked, FaInfoCircle } from 'react-icons/fa';
import type { GroupSearchParams, Group } from '@/lib/types';
import type { GeocodingResult } from '@/lib/utils/geocodingService';
import AdvancedLocationSearch from '../location/AdvancedLocationSearch';

// Dynamically import the globe component with no SSR
const GlobalRealisticGlobe = dynamic(
  () => import('./GlobalRealisticGlobe').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[#292929]">
        <div className="flex flex-col items-center">
          <FaSpinner className="text-blue-500 text-3xl animate-spin mb-4" />
          <div className="text-gray-400 tracking-wider text-sm">Loading globe visualization...</div>
        </div>
      </div>
    )
  }
);

interface GlobeWithSearchProps {
  groups?: Array<{
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
  }>;
  onGroupSelect?: (group: any) => void;
  onSearchSubmit?: (params: GroupSearchParams) => void;
  initialCoordinates?: { lat: number; lng: number };
  height?: string;
  width?: string;
  showSidebar?: boolean;
  className?: string;
}

/**
 * A component that combines the 3D globe with search functionality
 */
const GlobeWithSearch: React.FC<GlobeWithSearchProps> = ({
  groups = [],
  onGroupSelect,
  onSearchSubmit,
  initialCoordinates,
  height = '600px',
  width = '100%',
  showSidebar = true,
  className = ''
}) => {
  // Component state
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [searchParams, setSearchParams] = useState<GroupSearchParams>({
    city: '',
    state: '',
    keywords: ''
  });
  const [viewMode, setViewMode] = useState<'globe' | 'list'>('globe');
  const [isSearchingGroups, setIsSearchingGroups] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'low' : 'medium'
  );
  
  // Refs
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle group selection
  const handleGroupSelect = useCallback((group: any) => {
    setSelectedGroupId(group.id === selectedGroupId ? undefined : group.id);
    
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  }, [onGroupSelect, selectedGroupId]);
  
  // Handle location selection
  const handleLocationSelect = useCallback((location: GeocodingResult) => {
    setSelectedLocation(location);
    
    // Update search parameters with location info
    if (location.address) {
      setSearchParams(prev => ({
        ...prev,
        city: location.address?.city || prev.city,
        state: location.address?.state || prev.state,
      }));
    }
  }, []);
  
  // Handle search submission
  const handleSearch = useCallback((params: GroupSearchParams) => {
    setSearchParams(params);
    setIsSearchingGroups(true);
    
    if (onSearchSubmit) {
      onSearchSubmit(params);
    }
    
    // Simulated search delay
    setTimeout(() => {
      setIsSearchingGroups(false);
    }, 800);
  }, [onSearchSubmit]);
  
  // Auto-detect device performance on first render
  useEffect(() => {
    // Simple performance detection based on device memory and connection
    if (typeof window !== 'undefined') {
      // Check if we can detect device memory (Chrome only)
      if ((navigator as any).deviceMemory) {
        const memory = (navigator as any).deviceMemory;
        
        if (memory <= 2) {
          setPerformanceLevel('low');
        } else if (memory <= 4) {
          setPerformanceLevel('medium');
        } else if (memory <= 8) {
          setPerformanceLevel('high');
        } else {
          setPerformanceLevel('ultra');
        }
      } else {
        // Fallback detection based on screen width
        if (window.innerWidth < 768) {
          setPerformanceLevel('low');
        } else if (window.innerWidth < 1280) {
          setPerformanceLevel('medium');
        } else {
          setPerformanceLevel('high');
        }
      }
    }
  }, []);
  
  // Prepare groups data for the globe component
  const transformedGroups = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description || '',
    geo_location: group.geo_location ? {
      type: group.geo_location.type || 'Point',
      coordinates: Array.isArray(group.geo_location.coordinates) 
        ? group.geo_location.coordinates 
        : []
    } : undefined,
    city: group.city || undefined,
    state: group.state || undefined
  }));
  
  return (
    <div className={`globe-search-container relative ${className}`} ref={containerRef} style={{ height, width }}>
      {/* Globe/List View Toggle */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-1 shadow-lg">
        <div className="flex space-x-1">
          <button
            onClick={() => setViewMode('globe')}
            className={`p-2 rounded ${viewMode === 'globe' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-200 hover:bg-gray-700'}`}
            title="Globe View"
          >
            <FaGlobe />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-200 hover:bg-gray-700'}`}
            title="List View"
          >
            <FaList />
          </button>
        </div>
      </div>
      
      {/* Search Container - always visible */}
      <div className="absolute top-4 left-4 right-24 z-20 max-w-2xl mx-auto">
        <div className="bg-black/60 backdrop-blur-sm p-4 rounded-lg shadow-lg">
          <AdvancedLocationSearch
            onLocationSelect={handleLocationSelect}
            onSearch={handleSearch}
            globeRef={globeRef}
            showCurrentLocation={true}
            placeholder="Search by city, state, or ZIP code..."
          />
          
          {/* Filter Toggle */}
          <div className="mt-2 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm flex items-center text-gray-300 hover:text-white"
            >
              <FaFilter className="mr-1" size={12} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            
            {isSearchingGroups ? (
              <div className="text-gray-400 text-sm flex items-center">
                <FaSpinner className="animate-spin mr-2" size={12} />
                Searching...
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                {groups.length} {groups.length === 1 ? 'group' : 'groups'} found
              </div>
            )}
          </div>
          
          {/* Additional Filters - conditionally visible */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="keywords" className="block text-xs text-gray-400 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  id="keywords"
                  className="form-input bg-[#3a3a3a] w-full py-1 px-2 text-sm"
                  placeholder="Search in description..."
                  value={searchParams.keywords}
                  onChange={(e) => setSearchParams({...searchParams, keywords: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchParams)}
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-xs text-gray-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  className="form-input bg-[#3a3a3a] w-full py-1 px-2 text-sm"
                  placeholder="City name..."
                  value={searchParams.city}
                  onChange={(e) => setSearchParams({...searchParams, city: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchParams)}
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-xs text-gray-400 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  className="form-input bg-[#3a3a3a] w-full py-1 px-2 text-sm"
                  placeholder="State abbreviation..."
                  value={searchParams.state}
                  onChange={(e) => setSearchParams({...searchParams, state: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchParams)}
                />
              </div>
              
              <div className="md:col-span-3 flex justify-end mt-2">
                <button
                  onClick={() => handleSearch(searchParams)}
                  className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Performance Options */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg">
        <select
          value={performanceLevel}
          onChange={(e) => setPerformanceLevel(e.target.value as any)}
          className="bg-transparent text-white text-xs border-none px-3 py-2 appearance-none cursor-pointer"
          title="Performance Settings"
        >
          <option value="low" className="bg-gray-900">Low Performance</option>
          <option value="medium" className="bg-gray-900">Medium Performance</option>
          <option value="high" className="bg-gray-900">High Quality</option>
          <option value="ultra" className="bg-gray-900">Ultra Quality</option>
        </select>
      </div>
      
      {/* No Results Message */}
      {groups.length === 0 && !isSearchingGroups && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center max-w-md pointer-events-auto">
            <FaInfoCircle className="text-yellow-500 text-3xl mx-auto mb-3" />
            <h3 className="text-white text-lg font-semibold mb-2">No Groups Found</h3>
            <p className="text-gray-300 mb-4">
              Try adjusting your search criteria or explore a different location.
            </p>
            <button
              onClick={() => {
                // Reset search
                setSearchParams({
                  city: '',
                  state: '',
                  keywords: ''
                });
                handleSearch({
                  city: '',
                  state: '',
                  keywords: ''
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Show All Groups
            </button>
          </div>
        </div>
      )}
      
      {/* Group Info Sidebar - conditionally visible */}
      {showSidebar && viewMode === 'globe' && groups.length > 0 && (
        <div className="absolute top-32 bottom-4 right-4 z-10 w-80 overflow-hidden flex flex-col">
          <div className="flex-grow overflow-y-auto bg-black/60 backdrop-blur-sm rounded-lg shadow-lg">
            <div className="p-4">
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
                <FaMapMarked className="mr-2" />
                Groups in this Area
              </h3>
              
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedGroupId === group.id 
                        ? 'bg-blue-900/70 border border-blue-500'
                        : 'bg-gray-800/60 hover:bg-gray-700/60 border border-transparent'
                    }`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <h4 className="text-white font-medium">{group.name}</h4>
                    
                    <div className="text-xs text-gray-400 mt-1 flex items-center">
                      <FaMapMarkerAlt className="mr-1 text-gray-500" />
                      {[group.city, group.state].filter(Boolean).join(', ')}
                    </div>
                    
                    {selectedGroupId === group.id && group.description && (
                      <div className="mt-2 text-sm text-gray-300">
                        {group.description.length > 120
                          ? `${group.description.substring(0, 120)}...`
                          : group.description}
                      </div>
                    )}
                    
                    {selectedGroupId === group.id && (
                      <div className="mt-3 flex justify-between">
                        {group.email && (
                          <a 
                            href={`mailto:${group.email}`}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Email
                          </a>
                        )}
                        
                        {group.website && (
                          <a 
                            href={group.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        )}
                        
                        {group.phone && (
                          <a 
                            href={`tel:${group.phone}`}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Call
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area - Globe or List View */}
      <div className="absolute inset-0 z-0">
        {viewMode === 'globe' ? (
          <GlobalRealisticGlobe
            ref={globeRef}
            height="100%"
            width="100%"
            groups={transformedGroups}
            selectedGroupId={selectedGroupId}
            onGroupSelect={handleGroupSelect}
            initialCoordinates={selectedLocation ? 
              { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
              initialCoordinates
            }
            autoRotate={!selectedGroupId && !selectedLocation}
            performanceLevel={performanceLevel}
            markerType="pulse"
            weatherType="clear"
          />
        ) : (
          <div className="h-full w-full bg-[#1e1e1e] overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto mt-16">
              <h2 className="text-2xl font-light text-white mb-6">Groups List View</h2>
              
              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <div 
                      key={group.id}
                      className="bg-[#292929] rounded-lg p-4 hover:bg-[#333333] transition-colors cursor-pointer"
                      onClick={() => handleGroupSelect(group)}
                    >
                      <h3 className="text-lg font-medium text-white mb-2">{group.name}</h3>
                      
                      <div className="text-sm text-gray-400 mb-3 flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-gray-500" />
                        {[group.city, group.state].filter(Boolean).join(', ')}
                      </div>
                      
                      {group.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex justify-start space-x-4 text-sm">
                        {group.email && (
                          <a 
                            href={`mailto:${group.email}`}
                            className="text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Email
                          </a>
                        )}
                        
                        {group.website && (
                          <a 
                            href={group.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        )}
                        
                        {group.phone && (
                          <a 
                            href={`tel:${group.phone}`}
                            className="text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  No groups found matching your search criteria
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeWithSearch;