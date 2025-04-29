'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaSpinner } from 'react-icons/fa';

// Dynamically import the GlobeComponent to avoid SSR issues with Cesium
const GlobeComponent = dynamic(
  () => import('../globe').then(mod => mod.GlobeComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen w-full bg-gray-900">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mx-auto mb-4" />
          <p className="text-white text-lg">Loading Globe Visualization...</p>
        </div>
      </div>
    )
  }
);

// Generate some example groups for testing
const generateExampleGroups = (count: number = 15) => {
  const groups = [];
  // Centers roughly around the United States
  const centerLat = 39.8283;
  const centerLng = -98.5795;
  
  for (let i = 0; i < count; i++) {
    // Generate random positions around the center
    const latOffset = (Math.random() - 0.5) * 40; // +/- 20 degrees
    const lngOffset = (Math.random() - 0.5) * 80; // +/- 40 degrees
    
    groups.push({
      id: `group-${i}`,
      name: `Support Group ${i + 1}`,
      description: `This is an example support group for demonstration purposes.`,
      geo_location: {
        type: 'Point',
        coordinates: [centerLng + lngOffset, centerLat + latOffset]
      },
      city: `City ${i + 1}`,
      state: `State ${i % 50}`,
      approved: true
    });
  }
  
  return groups;
};

export default function GlobeDemo() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [exampleGroups] = useState(() => generateExampleGroups(20));
  
  // Simulate getting user's location
  useEffect(() => {
    // In a real app, you would use the browser's geolocation API
    // or get the location from a service
    
    // For demo purposes, set a hardcoded location (San Francisco)
    setTimeout(() => {
      setUserLocation({
        lat: 37.7749,
        lng: -122.4194
      });
    }, 1000);
  }, []);
  
  // Handle group selection
  const handleGroupSelect = (group: any) => {
    console.log('Group selected:', group);
    setSelectedGroupId(group.id === selectedGroupId ? undefined : group.id);
  };
  
  return (
    <div className="h-screen w-full">
      {/* Information Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 p-4 rounded text-white max-w-md">
        <h2 className="text-xl font-bold mb-2">Globe Visualization Demo</h2>
        <p className="mb-4">This is a demonstration of the 3D globe with sample support groups.</p>
        
        {selectedGroupId ? (
          <div className="bg-blue-900/50 p-3 rounded">
            <h3 className="font-semibold">Selected Group</h3>
            <p>{exampleGroups.find(g => g.id === selectedGroupId)?.name}</p>
            <p className="text-sm text-blue-200 mt-1">
              {exampleGroups.find(g => g.id === selectedGroupId)?.description}
            </p>
            <button 
              onClick={() => setSelectedGroupId(undefined)}
              className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <p>Click on any point to select a group</p>
        )}
      </div>
      
      {/* The Globe Component */}
      <GlobeComponent 
        groups={exampleGroups}
        onGroupSelect={handleGroupSelect}
        selectedGroupId={selectedGroupId}
        initialCoordinates={userLocation}
        height="100vh"
        width="100%"
      />
    </div>
  );
}