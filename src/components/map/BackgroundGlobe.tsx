'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

interface BackgroundGlobeProps {
  onLocationSelect?: (location: { lat: number; lng: number; name?: string }) => void;
  className?: string;
}

// A background version of the Globe component with location selection capabilities
const BackgroundGlobe: React.FC<BackgroundGlobeProps> = ({ onLocationSelect, className = '' }) => {
  const [mounted, setMounted] = useState(false);
  const globeRef = useRef<HTMLDivElement>(null);

  // Only load Three.js components on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create a simple loading element
  const LoadingElement = () => (
    <div className="h-full w-full flex items-center justify-center bg-transparent">
      <div className="text-white opacity-50 animate-pulse">Loading globe...</div>
    </div>
  );

  // Don't try to render anything on server
  if (!mounted) {
    return <LoadingElement />;
  }

  // Dynamically import only on client side
  const DynamicGlobeContent = dynamic(
    () => import('./EnhancedGlobeContent'),
    {
      ssr: false,
      loading: () => <LoadingElement />
    }
  );

  const handleLocationSelect = (location: string) => {
    if (onLocationSelect) {
      // Parse the location string to extract coordinates
      // This would depend on the format returned by the globe component
      // For example: "New York,40.7128,-74.0060"
      try {
        const parts = location.split(',');
        if (parts.length >= 3) {
          const name = parts[0];
          const lat = parseFloat(parts[1]);
          const lng = parseFloat(parts[2]);
          onLocationSelect({ lat, lng, name });
        }
      } catch (error) {
        console.error('Error parsing location:', error);
      }
    }
  };

  return (
    <div ref={globeRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <DynamicGlobeContent 
        onRegionSelect={handleLocationSelect} 
        interactive={true}
        backgroundMode={true}
      />
    </div>
  );
};

export default BackgroundGlobe;