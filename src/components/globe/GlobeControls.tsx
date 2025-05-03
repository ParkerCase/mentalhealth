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

const GlobeControls: React.FC<GlobeControlsProps> = ({
  onFlyTo,
  enabledTools = ['search', 'home', 'locate'],
  className = '',
}) => {
  const { viewer } = useCesium();
  const [location, setLocation] = useState({ lat: '', lng: '' });

  const handleFlyTo = () => {
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }
    if (onFlyTo) onFlyTo(lat, lng);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude.toString(), lng: coords.longitude.toString() });
        if (onFlyTo) onFlyTo(coords.latitude, coords.longitude);
      },
      () => alert('Unable to get location')
    );
  };

  const handleHome = () => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 30000000), // Higher altitude
        duration: 0,
      });
    }
  };

  return (
    <div className={`absolute top-4 right-4 z-10 ${className}`}>
      <div className="flex flex-col space-y-2">
      {enabledTools.includes('search') && (
  <div className="bg-black/70 backdrop-blur p-4 rounded-lg shadow-lg w-64 space-y-3 text-sm text-white">
    <div>
      <label className="block mb-1 opacity-70">Latitude</label>
      <input
        type="text"
        placeholder="e.g. 34.0522"
        value={location.lat}
        onChange={(e) => setLocation({ ...location, lat: e.target.value })}
        className="w-full bg-gray-800 text-white p-2 rounded border border-white/10 focus:outline-none"
      />
    </div>
    <div>
      <label className="block mb-1 opacity-70">Longitude</label>
      <input
        type="text"
        placeholder="e.g. -118.2437"
        value={location.lng}
        onChange={(e) => setLocation({ ...location, lng: e.target.value })}
        className="w-full bg-gray-800 text-white p-2 rounded border border-white/10 focus:outline-none"
      />
    </div>
    <button
      onClick={handleFlyTo}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
    >
      <FaSearch className="inline mr-2" /> Fly To
    </button>
  </div>
)}


        {enabledTools.includes('locate') && (
          <button
            className="p-2 bg-white rounded-full shadow hover:bg-blue-500 hover:text-white"
            onClick={handleLocate}
            title="Locate Me"
          >
            <FaLocationArrow />
          </button>
        )}

        {enabledTools.includes('home') && (
          <button
            className="p-2 bg-white rounded-full shadow hover:bg-blue-500 hover:text-white"
            onClick={handleHome}
            title="Home"
          >
            <FaHome />
          </button>
        )}
      </div>
    </div>
  );
};

export default GlobeControls;
