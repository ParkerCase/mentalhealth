// src/components/globe/GlobeController.tsx
import { useState } from 'react';
import * as Cesium from 'cesium';

interface GlobeControllerProps {
  viewer: Cesium.Viewer | null;
}

const GlobeController = ({ viewer }: GlobeControllerProps) => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const handleFlyTo = () => {
    if (!viewer) return;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Please enter valid latitude and longitude numbers.');
      return;
    }
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1000000), // 1,000 km up
      duration: 2
    });
  };

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '8px' }}>
      <div style={{ marginBottom: '8px', color: '#fff' }}>
        <div>Latitude:</div>
        <input
          type="text"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="e.g. 37.7749"
          style={{ width: '120px', marginBottom: '5px' }}
        />
        <div>Longitude:</div>
        <input
          type="text"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="e.g. -122.4194"
          style={{ width: '120px' }}
        />
      </div>
      <button onClick={handleFlyTo} style={{ width: '100%', padding: '5px', fontWeight: 'bold' }}>
        Fly To
      </button>
    </div>
  );
};

export default GlobeController;