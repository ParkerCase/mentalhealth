'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaSpinner, FaCog, FaSatellite, FaCloudSun, FaGlobeAmericas, FaUsers } from 'react-icons/fa';

// Dynamically import Globe component to avoid SSR issues
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

// Generate example groups with realistic data
const generateExampleGroups = (count: number = 25) => {
  const groupTypes = [
    'Support Group', 'Community Center', 'Wellness Circle', 
    'Resource Hub', 'Therapy Group', 'Activity Group'
  ];
  
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 }
  ];
  
  const states = [
    'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
    'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
  ];
  
  const descriptions = [
    'A supportive community for those seeking connection and understanding.',
    'Weekly meetings focused on shared experiences and mutual support.',
    'Resources and guidance for navigating life challenges together.',
    'Building connections and fostering personal growth through shared experiences.',
    'A safe space for open discussion and emotional support.'
  ];
  
  // Generate groups
  const groups = [];
  
  for (let i = 0; i < count; i++) {
    // Choose from predefined cities or random location
    let lat, lng, city, state;
    
    if (Math.random() > 0.3 && cities.length > 0) {
      // Use a predefined city
      const cityIndex = Math.floor(Math.random() * cities.length);
      const cityData = cities[cityIndex];
      
      // Add some variation within the city
      lat = cityData.lat + (Math.random() - 0.5) * 0.5;
      lng = cityData.lng + (Math.random() - 0.5) * 0.5;
      city = cityData.name;
      
      // Match state to city
      switch (cityData.name) {
        case 'New York': state = 'NY'; break;
        case 'Los Angeles': case 'San Francisco': case 'San Diego': state = 'CA'; break;
        case 'Chicago': state = 'IL'; break;
        case 'Houston': case 'San Antonio': case 'Dallas': state = 'TX'; break;
        case 'Phoenix': state = 'AZ'; break;
        case 'Philadelphia': state = 'PA'; break;
        default: state = states[Math.floor(Math.random() * states.length)];
      }
    } else {
      // Random location in continental US
      lat = 37.0902 + (Math.random() - 0.5) * 10;
      lng = -95.7129 + (Math.random() - 0.5) * 40;
      city = `City ${i + 1}`;
      state = states[Math.floor(Math.random() * states.length)];
    }
    
    // Create group object
    groups.push({
      id: `group-${i}`,
      name: `${groupTypes[Math.floor(Math.random() * groupTypes.length)]} ${i + 1}`,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      geo_location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      city,
      state,
      approved: true
    });
  }
  
  return groups;
};

interface EnhancedGlobeDemoProps {
  initialCount?: number;
}

const EnhancedGlobeDemo: React.FC<EnhancedGlobeDemoProps> = ({ initialCount = 25 }) => {
  // State
  const [groups] = useState(() => generateExampleGroups(initialCount));
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  
  // Feature toggles
  const [markerType, setMarkerType] = useState<'pin' | 'dot' | 'pulse'>('pulse');
  const [weatherType, setWeatherType] = useState<'clear' | 'clouds' | 'storm' | 'fog'>('clear');
  const [weatherIntensity, setWeatherIntensity] = useState(0.5);
  const [showSatellites, setShowSatellites] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
  const [autoRotate, setAutoRotate] = useState(false);
  const [debugInfo, setDebugInfo] = useState(false);
  
  // Simulate getting user's location
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
          // Fallback to San Francisco if geolocation fails
          setUserLocation({
            lat: 37.7749,
            lng: -122.4194
          });
        }
      );
    } else {
      // Fallback for browsers without geolocation
      setUserLocation({
        lat: 37.7749,
        lng: -122.4194
      });
    }
  }, []);
  
  // Handle group selection
  const handleGroupSelect = (group: any) => {
    setSelectedGroupId(group.id === selectedGroupId ? undefined : group.id);
  };
  
  return (
    <div className="h-screen w-full relative">
      {/* Main Settings Panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black/70 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
          title="Settings"
        >
          <FaCog />
        </button>
        
        {showSettings && (
          <div className="bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm mt-2 w-64 h-auto">
            <h3 className="font-bold mb-3 border-b pb-1">Globe Settings</h3>
            
            <div className="space-y-3 mt-4">
              {/* Performance Setting */}
              <div>
                <label className="block text-sm font-medium mb-1">Performance</label>
                <select 
                  value={performanceLevel}
                  onChange={(e) => setPerformanceLevel(e.target.value as any)}
                  className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
                >
                  <option value="low">Low (Better Performance)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Better Quality)</option>
                  <option value="ultra">Ultra (Best Quality)</option>
                </select>
              </div>
              
              {/* Marker Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Marker Style</label>
                <select 
                  value={markerType}
                  onChange={(e) => setMarkerType(e.target.value as any)}
                  className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
                >
                  <option value="dot">Simple Dots</option>
                  <option value="pin">Map Pins</option>
                  <option value="pulse">Pulsing Effect</option>
                </select>
              </div>
              
              {/* Weather Settings */}
              <div>
                <label className="block text-sm font-medium mb-1">Weather Effect</label>
                <select 
                  value={weatherType}
                  onChange={(e) => setWeatherType(e.target.value as any)}
                  className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
                >
                  <option value="clear">Clear</option>
                  <option value="clouds">Clouds</option>
                  <option value="fog">Fog</option>
                  <option value="storm">Storm</option>
                </select>
                
                {weatherType !== 'clear' && (
                  <div className="mt-2">
                    <label className="block text-xs mb-1">Intensity: {weatherIntensity.toFixed(1)}</label>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1" 
                      value={weatherIntensity}
                      onChange={(e) => setWeatherIntensity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              
              {/* Feature Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Show Satellites</label>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={showSatellites}
                      onChange={() => setShowSatellites(!showSatellites)}
                      className="sr-only"
                      id="satelliteToggle"
                    />
                    <label 
                      htmlFor="satelliteToggle"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${showSatellites ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${showSatellites ? 'translate-x-4' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm">Auto Rotate</label>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={autoRotate}
                      onChange={() => setAutoRotate(!autoRotate)}
                      className="sr-only"
                      id="rotateToggle"
                    />
                    <label 
                      htmlFor="rotateToggle"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${autoRotate ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${autoRotate ? 'translate-x-4' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm">Show Debug Info</label>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={debugInfo}
                      onChange={() => setDebugInfo(!debugInfo)}
                      className="sr-only"
                      id="debugToggle"
                    />
                    <label 
                      htmlFor="debugToggle"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${debugInfo ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span 
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${debugInfo ? 'translate-x-4' : 'translate-x-0'}`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Feature Quick Access Buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex space-x-2">
        <button
          onClick={() => setShowSatellites(!showSatellites)}
          className={`p-2 rounded-full ${showSatellites ? 'bg-blue-600 text-white' : 'bg-black/70 text-white'} hover:bg-blue-600 transition-colors`}
          title="Toggle Satellites"
        >
          <FaSatellite />
        </button>
        
        <button
          onClick={() => setWeatherType(weatherType === 'clear' ? 'clouds' : 'clear')}
          className={`p-2 rounded-full ${weatherType !== 'clear' ? 'bg-blue-600 text-white' : 'bg-black/70 text-white'} hover:bg-blue-600 transition-colors`}
          title="Toggle Weather"
        >
          <FaCloudSun />
        </button>
        
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-full ${autoRotate ? 'bg-blue-600 text-white' : 'bg-black/70 text-white'} hover:bg-blue-600 transition-colors`}
          title="Toggle Auto-Rotation"
        >
          <FaGlobeAmericas />
        </button>
      </div>
      
      {/* Information panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/70 p-4 rounded text-white max-w-lg text-center">
        <h2 className="text-xl font-bold mb-2">Interactive 3D Globe</h2>
        <p>Explore global support groups and communities with our interactive visualization.</p>
        <p className="text-sm mt-2">Click on markers to see connections and details. Use controls to customize the view.</p>
      </div>
      
      {/* Selected Group Info */}
      {selectedGroupId && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm p-4 rounded text-white max-w-md">
          <div className="flex items-center mb-2">
            <FaUsers className="text-blue-400 mr-2" />
            <h3 className="font-bold text-lg">{groups.find(g => g.id === selectedGroupId)?.name}</h3>
          </div>
          <p className="mb-3 text-gray-300">
            {groups.find(g => g.id === selectedGroupId)?.description}
          </p>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{groups.find(g => g.id === selectedGroupId)?.city}, {groups.find(g => g.id === selectedGroupId)?.state}</span>
            <button 
              onClick={() => setSelectedGroupId(undefined)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* The Globe Component */}
      <GlobeComponent 
        groups={groups}
        onGroupSelect={handleGroupSelect}
        selectedGroupId={selectedGroupId}
        initialCoordinates={userLocation}
        height="100vh"
        width="100%"
        showSatellites={showSatellites}
        performanceLevel={performanceLevel}
        weatherType={weatherType}
        weatherIntensity={weatherIntensity}
        markerType={markerType}
        autoRotate={autoRotate}
        debugInfo={debugInfo}
      />
    </div>
  );
};

export default EnhancedGlobeDemo;