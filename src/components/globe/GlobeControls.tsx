'use client';

import React, { useState } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';
import { FaSearch, FaHome, FaLocationArrow, FaCog } from 'react-icons/fa';

interface GlobeControlsProps {
  onFlyTo?: (lat: number, lng: number) => void;
  enabledTools?: ('search' | 'home' | 'locate' | 'settings')[];
  className?: string;
}

/**
 * Helper to create terrain provider with proper fallbacks
 */
function createCompatibleTerrainProvider(options: { 
  requestVertexNormals?: boolean, 
  requestWaterMask?: boolean 
} = {}) {
  try {
    // Handle different Cesium versions with type assertion for TypeScript
    if (Cesium.Ion) {
      // Cast to any to bypass TypeScript errors
      const ionAny = Cesium.Ion as any;
      if (typeof ionAny.createWorldTerrain === 'function') {
        return ionAny.createWorldTerrain(options);
      }
    }
    
    // For older versions as a fallback
    if (typeof (Cesium as any).createWorldTerrain === 'function') {
      return (Cesium as any).createWorldTerrain(options);
    }
    
    // Check for CesiumTerrainProvider
    if (Cesium.CesiumTerrainProvider) {
      // Handle different ways to set the URL
      if (Cesium.IonResource) {
        // Type assertion to bypass TypeScript type checking
        return new Cesium.CesiumTerrainProvider({
          url: 'https://assets.agi.com/stk-terrain/world' as any
        });
      } else {
        return new Cesium.CesiumTerrainProvider({
          url: 'https://assets.agi.com/stk-terrain/world'
        });
      }
    }
    
    // Final fallback to flat terrain
    return new Cesium.EllipsoidTerrainProvider();
  } catch (e) {
    console.warn('Error creating terrain provider:', e);
    return new Cesium.EllipsoidTerrainProvider();
  }
}

/**
 * Helper to safely handle promises for terrain providers
 */
function isTerrainProviderPromise(value: any): value is Promise<Cesium.TerrainProvider> {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

/**
 * Interactive controls for the Globe component
 */
const GlobeControls: React.FC<GlobeControlsProps> = ({ 
  onFlyTo,
  enabledTools = ['search', 'home', 'locate'],
  className = ''
}) => {
  const { viewer } = useCesium();
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Function to fly to coordinates
  const handleFlyTo = () => {
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude');
      return;
    }
    
    if (onFlyTo) {
      onFlyTo(lat, lng);
    } else if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, 1000000),
        duration: 2
      });
    }
  };

  // Function to detect user's location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          setLocation({
            lat: latitude.toString(),
            lng: longitude.toString()
          });
          
          // Optionally auto-fly to the location
          if (viewer && !viewer.isDestroyed()) {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 500000),
              duration: 2
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Function to return to default view
  const handleHome = () => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-98.5795, 39.8283, 10000000),
        duration: 2
      });
    }
  };

  // Toggle settings panel
  const toggleSettings = () => {
    if (activeTab === 'settings') {
      setActiveTab(null);
    } else {
      setActiveTab('settings');
      setIsExpanded(true);
    }
  };

  // Toggle search panel
  const toggleSearch = () => {
    if (activeTab === 'search') {
      setActiveTab(null);
    } else {
      setActiveTab('search');
      setIsExpanded(true);
    }
  };
  
  // Helper function to safely create and set terrain provider
  const safelySetTerrainProvider = (options: { 
    requestVertexNormals?: boolean, 
    requestWaterMask?: boolean 
  } = {}) => {
    if (!viewer || viewer.isDestroyed()) return;
    
    try {
      // Try to create the terrain provider
      const terrainProviderResult = createCompatibleTerrainProvider(options);
      
      // Handle both Promise and direct return safely
      if (isTerrainProviderPromise(terrainProviderResult)) {
        // It's a Promise
        terrainProviderResult
          .then((provider: Cesium.TerrainProvider) => {
            if (viewer && !viewer.isDestroyed()) {
              viewer.terrainProvider = provider;
            }
          })
          .catch((error: any) => {
            console.warn('Failed to load terrain provider:', error);
            if (viewer && !viewer.isDestroyed()) {
              viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            }
          });
      } else {
        // Direct return
        viewer.terrainProvider = terrainProviderResult;
      }
    } catch (e) {
      console.warn('Error creating terrain provider:', e);
      if (viewer && !viewer.isDestroyed()) {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      }
    }
  };
  
  return (
    <div className={`absolute top-4 right-4 z-10 ${className}`}>
      {/* Main controls */}
      <div className="flex flex-col space-y-2">
        {enabledTools.includes('search') && (
          <button 
            onClick={toggleSearch}
            className={`p-2 rounded-full ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} shadow hover:bg-blue-500 hover:text-white transition-colors`}
            title="Search"
          >
            <FaSearch />
          </button>
        )}
        
        {enabledTools.includes('home') && (
          <button 
            onClick={handleHome}
            className="p-2 rounded-full bg-white text-gray-800 shadow hover:bg-blue-500 hover:text-white transition-colors"
            title="Home View"
          >
            <FaHome />
          </button>
        )}
        
        {enabledTools.includes('locate') && (
          <button 
            onClick={handleLocateMe}
            className="p-2 rounded-full bg-white text-gray-800 shadow hover:bg-blue-500 hover:text-white transition-colors"
            title="Find My Location"
          >
            <FaLocationArrow />
          </button>
        )}
        
        {enabledTools.includes('settings') && (
          <button 
            onClick={toggleSettings}
            className={`p-2 rounded-full ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} shadow hover:bg-blue-500 hover:text-white transition-colors`}
            title="Settings"
          >
            <FaCog />
          </button>
        )}
      </div>
      
      {/* Expanded panels */}
      {activeTab === 'search' && (
        <div className="mt-2 p-4 bg-white rounded shadow-lg">
          <h3 className="text-sm font-semibold mb-2">Search Location</h3>
          <div className="space-y-2">
            <div>
              <label htmlFor="lat" className="block text-xs text-gray-600">Latitude</label>
              <input
                id="lat"
                type="text"
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                placeholder="e.g. 37.7749"
                className="w-full text-sm p-1 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label htmlFor="lng" className="block text-xs text-gray-600">Longitude</label>
              <input
                id="lng"
                type="text"
                value={location.lng}
                onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                placeholder="e.g. -122.4194"
                className="w-full text-sm p-1 border border-gray-300 rounded"
              />
            </div>
            <button 
              onClick={handleFlyTo}
              className="w-full text-sm bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition-colors"
            >
              Fly To
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="mt-2 p-4 bg-white rounded shadow-lg">
          <h3 className="text-sm font-semibold mb-2">Visual Settings</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="lighting"
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => {
                  if (viewer && !viewer.isDestroyed()) {
                    viewer.scene.globe.enableLighting = e.target.checked;
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="lighting" className="ml-2 text-sm text-gray-700">
                Enable Lighting
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="atmosphere"
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => {
                  if (viewer && !viewer.isDestroyed() && viewer.scene.skyAtmosphere) {
                    viewer.scene.skyAtmosphere.show = e.target.checked;
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="atmosphere" className="ml-2 text-sm text-gray-700">
                Show Atmosphere
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="terrain"
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => {
                  if (viewer && !viewer.isDestroyed()) {
                    if (e.target.checked) {
                      // Re-enable terrain
                      safelySetTerrainProvider({
                        requestVertexNormals: true,
                        requestWaterMask: false
                      });
                    } else {
                      // Disable terrain (flat earth)
                      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                    }
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="terrain" className="ml-2 text-sm text-gray-700">
                Show Terrain
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobeControls;