// src/components/location/AdvancedLocationSearch.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaSearch, FaMapMarkerAlt, FaSpinner, FaTimes, FaLocationArrow } from 'react-icons/fa';
import { geocodeAddress, GeocodingResult } from '@/lib/utils/geocodingService';
import { GroupSearchParams } from '@/lib/types';

interface AdvancedLocationSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  onSearch?: (params: GroupSearchParams) => void;
  globeRef?: React.RefObject<any>; // Reference to the globe component
  className?: string;
  placeholder?: string;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
}

/**
 * An enhanced location search component with map integration
 */
const AdvancedLocationSearch: React.FC<AdvancedLocationSearchProps> = ({ 
  onLocationSelect, 
  onSearch,
  globeRef,
  className = '',
  placeholder = 'Enter city, state, or ZIP code...',
  showCurrentLocation = true,
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus input if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError('');
    setShowResults(true);
    
    try {
      const geocodingResults = await geocodeAddress(searchTerm);
      
      if (geocodingResults.length === 0) {
        setError('No locations found. Please try a different search term.');
      } else {
        setResults(geocodingResults);
        
        // If we have a globe reference, fly to the first result location
        if (globeRef?.current && geocodingResults[0]) {
          globeRef.current.flyToLocation(
            geocodingResults[0].lat,
            geocodingResults[0].lng,
            2000000 // Height in meters
          );
        }
        
        // If we have search params to update, use the first result to populate city/state
        if (onSearch) {
          const firstResult = geocodingResults[0];
          const city = firstResult.address?.city || '';
          const state = firstResult.address?.state || '';
          
          onSearch({
            city,
            state,
            keywords: ''
          });
        }
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setError('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, onSearch, globeRef]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationClick = (location: GeocodingResult) => {
    onLocationSelect(location);
    setShowResults(false);
    
    // If we have a globe reference, fly to the selected location
    if (globeRef?.current) {
      globeRef.current.flyToLocation(
        location.lat,
        location.lng,
        2000000 // Height in meters
      );
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode the coordinates to get location name
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place`
          );
          
          if (!response.ok) throw new Error("Geocoding failed");
          
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const place = data.features[0];
            // Format the location name to display in the search box
            const locationName = place.place_name;
            setSearchTerm(locationName);
            
            // Create a geocoding result from the reverse geocode
            const geocodingResult: GeocodingResult = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              name: place.text,
              displayName: place.place_name,
              address: {
                city: place.text,
                state: place.context?.find((ctx: any) => ctx.id.startsWith('region'))?.text,
                country: place.context?.find((ctx: any) => ctx.id.startsWith('country'))?.text,
                postcode: place.context?.find((ctx: any) => ctx.id.startsWith('postcode'))?.text,
              }
            };
            
            // Process as if the user selected this location
            onLocationSelect(geocodingResult);
            
            // Update search parameters
            if (onSearch) {
              onSearch({
                city: geocodingResult.address?.city || '',
                state: geocodingResult.address?.state || '',
                keywords: ''
              });
            }
            
            // If we have a globe reference, fly to the user's location
            if (globeRef?.current) {
              globeRef.current.flyToLocation(
                position.coords.latitude,
                position.coords.longitude,
                2000000 // Height in meters
              );
            }
          }
        } catch (error) {
          console.error("Error getting location name:", error);
          setError("Couldn't determine your location name");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Unable to retrieve your location. Please check your permissions.");
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaMapMarkerAlt className="text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder={placeholder}
            className="form-input bg-[#3a3a3a] w-full py-2 pl-10 pr-10 text-white"
            disabled={isSearching || isLoadingLocation}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={handleClearSearch}
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim() || isLoadingLocation}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
          title="Search location"
        >
          {isSearching ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSearch />
          )}
        </button>
        
        {showCurrentLocation && (
          <button
            onClick={getCurrentLocation}
            disabled={isLoadingLocation || isSearching}
            className="ml-2 bg-[#3a3a3a] text-white px-4 py-2 rounded-md hover:bg-[#4a4a4a] transition-colors disabled:bg-[#2a2a2a] flex items-center justify-center"
            title="Use current location"
          >
            {isLoadingLocation ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaLocationArrow />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="text-red-400 text-xs mt-1 pl-1">{error}</div>
      )}
      
      {showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#292929] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div 
              key={index}
              onClick={() => handleLocationClick(result)}
              className="flex items-start p-3 hover:bg-[#3a3a3a] cursor-pointer border-b border-gray-700 last:border-0"
            >
              <FaMapMarkerAlt className="text-gray-400 mr-3 flex-shrink-0 mt-1" />
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{result.displayName}</div>
                <div className="text-xs text-gray-400 truncate">
                  {result.address?.city && `${result.address.city}, `}
                  {result.address?.state && result.address.state}
                  {result.address?.country && ` • ${result.address.country}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedLocationSearch;