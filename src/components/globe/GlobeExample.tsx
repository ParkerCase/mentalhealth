'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the optimized Globe component with no SSR
const OptimizedGlobe = dynamic(
  () => import('@/components/globe/RealisticGlobePerformance'),
  { ssr: false }
);

// Example groups data
const exampleGroups = [
  {
    id: '1',
    name: 'New York',
    geo_location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128]
    },
    city: 'New York',
    state: 'NY'
  },
  {
    id: '2',
    name: 'Los Angeles',
    geo_location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522]
    },
    city: 'Los Angeles',
    state: 'CA'
  },
  {
    id: '3',
    name: 'Chicago',
    geo_location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781]
    },
    city: 'Chicago',
    state: 'IL'
  }
];

export default function GlobeExample() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  
  // Get user's location (optional)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback location (New York)
          setUserLocation({
            lat: 40.7128,
            lng: -74.006
          });
        }
      );
    }
  }, []);
  
  // Handle group selection
  const handleGroupSelect = (group: any) => {
    console.log('Selected group:', group);
    setSelectedGroupId(previousId => 
      previousId === group.id ? undefined : group.id
    );
  };
  
  return (
    <div className="h-screen w-full">
      <Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-black">
          <div className="text-white">Loading Globe...</div>
        </div>
      }>
        <OptimizedGlobe
          groups={exampleGroups}
          selectedGroupId={selectedGroupId}
          onGroupSelect={handleGroupSelect}
          initialCoordinates={userLocation}
          autoRotate={!selectedGroupId} // Stop rotating when a group is selected
        />
      </Suspense>
      
      {/* Optional UI overlay for selected group info */}
      {selectedGroupId && (
        <div className="absolute bottom-4 left-4 bg-black/60 text-white p-4 rounded">
          <h3>Selected: {exampleGroups.find(g => g.id === selectedGroupId)?.name}</h3>
          <p>
            {exampleGroups.find(g => g.id === selectedGroupId)?.city}, 
            {exampleGroups.find(g => g.id === selectedGroupId)?.state}
          </p>
        </div>
      )}
    </div>
  );
}