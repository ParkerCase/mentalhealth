// src/components/globe/SimpleGlobe.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { FaSearch, FaSpinner } from 'react-icons/fa';

// Define the structure of our group data
export interface GroupData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface SimpleGlobeProps {
  groups: GroupData[];
  height?: number;
  width?: number;
  onGroupSelect?: (group: GroupData) => void;
  initialCoordinates?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean; // If false, disables search and selection
  nightImageUrl?: string; // Optional night (city lights) texture
  globeImageUrl?: string;
  bumpImageUrl?: string;
  backgroundImageUrl?: string;
  style?: React.CSSProperties;
}

const SimpleGlobe: React.FC<SimpleGlobeProps> = ({ 
  groups = [], 
  height = 600,
  width = 800,
  onGroupSelect,
  initialCoordinates,
  className = '',
  interactive = true,
  nightImageUrl,
  globeImageUrl,
  bumpImageUrl,
  backgroundImageUrl,
  style
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [containerWidth, setContainerWidth] = useState(width);
  const [containerHeight, setContainerHeight] = useState(height);
  const globeRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Set up container size based on the parent element
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth);
          setContainerHeight(containerRef.current.clientHeight);
        }
      };

      // Initial update
      updateDimensions();

      // Update on resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  // Use geolocation if initialCoordinates is not provided
  useEffect(() => {
    if (!initialCoordinates && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!globeRef.current) return;
          globeRef.current.pointOfView({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            altitude: 1.5
          }, 1000);
        },
        () => {
          // fallback: do nothing, keep default
        }
      );
    }
  }, [initialCoordinates]);

  // Imperative auto-rotation logic
  useEffect(() => {
    let animationId: number;
    const rotate = () => {
      if (
        isAutoRotating &&
        globeRef.current &&
        globeRef.current.controls &&
        typeof globeRef.current.controls === 'function'
      ) {
        const controls = globeRef.current.controls();
        if (
          controls &&
          typeof controls.getAzimuthalAngle === 'function' &&
          typeof controls.setAzimuthalAngle === 'function'
        ) {
          const curr = controls.getAzimuthalAngle();
          controls.setAzimuthalAngle(curr + 0.001); // slower rotation
        }
      }
      animationId = requestAnimationFrame(rotate);
    };
    rotate();
    return () => cancelAnimationFrame(animationId);
  }, [isAutoRotating]);

  // Stop auto-rotation when a group is selected
  useEffect(() => {
    setIsAutoRotating(!highlightedGroup);
  }, [highlightedGroup]);

  // Force auto-rotation for non-interactive globes
  useEffect(() => {
    if (!interactive) setIsAutoRotating(true);
  }, [interactive]);

  // Handle point click with the correct type signature
  const handlePointClick = useCallback((point: any, event: MouseEvent, coords: { lat: number; lng: number; altitude: number }) => {
    if (!interactive) return;
    const group = point as GroupData;
    if (onGroupSelect && group) {
      onGroupSelect(group);
      setHighlightedGroup(group.id);
    }
  }, [onGroupSelect, interactive]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    // Find a group matching the search term
    const foundGroup = groups.find(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.city && group.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.state && group.state.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    if (foundGroup && globeRef.current) {
      // Fly to the group location
      globeRef.current.pointOfView({ 
        lat: foundGroup.lat, 
        lng: foundGroup.lng,
        altitude: 1.5 // Adjust zoom level
      }, 1000); // Animation duration in ms
      
      // Highlight the group
      setHighlightedGroup(foundGroup.id);
      
      // Notify parent component
      if (onGroupSelect) {
        onGroupSelect(foundGroup);
      }
    }
    
    setIsSearching(false);
  }, [searchTerm, groups, onGroupSelect]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`} 
      style={{
        height: typeof height === 'string' ? height : `${height}px`,
        width: typeof width === 'string' ? width : `${width}px`,
        ...(style || {})
      }}
    >
      {/* Search bar (only if interactive) */}
      {interactive && (
        <div className="absolute top-4 left-4 z-10 w-full max-w-sm">
          <div className="bg-black/60 backdrop-blur-sm p-2 rounded-lg shadow-lg">
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for groups..."
                className="flex-grow px-3 py-2 bg-[#3a3a3a] text-white rounded-l-md border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
              >
                {isSearching ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Globe component */}
      <Globe
        ref={globeRef}
        globeImageUrl={globeImageUrl || "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"}
        bumpImageUrl={bumpImageUrl || "https://unpkg.com/three-globe/example/img/earth-topology.png"}
        backgroundImageUrl={backgroundImageUrl || "https://unpkg.com/three-globe/example/img/night-sky.png"}
        {...(nightImageUrl ? { nightImageUrl } : {})}
        
        // Points for each group
        pointsData={groups}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: any) => d.id === highlightedGroup ? '#FFFF00' : '#3B82F6'} 
        pointAltitude={0.01}
        pointRadius={0.5}
        pointLabel="name"
        onPointClick={handlePointClick}
        
        // Configure the globe appearance
        atmosphereColor="#4fc3f7"
        enablePointerInteraction={true}
        
        // Use the measured container dimensions
        width={containerWidth}
        height={containerHeight}
      />
    </div>
  );
};

export default SimpleGlobe;

// NOTE: For best results, use the latest versions of react-globe.gl and three.
// To show the night side/city lights, set initialCoordinates to e.g. { lat: 0, lng: -120 } on the home page.