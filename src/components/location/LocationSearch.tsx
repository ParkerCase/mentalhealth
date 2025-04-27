'use client';

import React, { useState, useCallback } from 'react';
import { FaSearch, FaMapMarkerAlt, FaSpinner, FaTimes } from 'react-icons/fa';
import { geocodeAddress, GeocodingResult } from '@/lib/utils/geocodingService';
import { useRouter } from 'next/navigation';
import { GroupSearchParams } from '@/lib/types';

interface LocationSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  onSearch?: (params: GroupSearchParams) => void;
  className?: string;
}

/**
 * A reusable location search component that provides geocoding functionality
 */
const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelect, 
  onSearch,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

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
  }, [searchTerm, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationClick = (location: GeocodingResult) => {
    onLocationSelect(location);
    setShowResults(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    setError('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder="Search for a location..."
            className="form-input bg-[#3a3a3a] w-full py-2 pl-3 pr-10"
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
          disabled={isSearching || !searchTerm.trim()}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
        >
          {isSearching ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSearch />
          )}
        </button>
      </div>
      
      {error && (
        <div className="text-red-400 text-xs mt-1 pl-1">{error}</div>
      )}
      
      {showResults && results.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#292929] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <div 
              key={index}
              onClick={() => handleLocationClick(result)}
              className="flex items-center p-3 hover:bg-[#3a3a3a] cursor-pointer border-b border-gray-700 last:border-0"
            >
              <FaMapMarkerAlt className="text-gray-400 mr-3 flex-shrink-0" />
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

export default LocationSearch;