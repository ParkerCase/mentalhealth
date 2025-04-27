'use client';

import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { Group } from '@/lib/types';

// Types for the GlobeComponent
interface GlobeComponentProps {
  groups: Group[];
  onGroupSelect?: (group: Group) => void;
  selectedGroupId?: string;
  initialCoordinates?: { lat: number; lng: number } | null;
  height?: string | number;
  width?: string | number;
  className?: string;
}

// Helper to get color based on group category or a default
const getGroupColor = (group: Group) => {
  // You can customize this to show different colors based on group attributes
  return group.approved ? '#3b82f6' : '#f59e0b';
};

const GlobeComponent: React.FC<GlobeComponentProps> = ({
  groups,
  onGroupSelect,
  selectedGroupId,
  initialCoordinates,
  height = '100%',
  width = '100%',
  className = '',
}) => {
  const globeRef = useRef<any>();
  const [pointsData, setPointsData] = useState<any[]>([]);

  // Process groups into globe marker data
  useEffect(() => {
    if (!groups?.length) return;

    const processedData = groups
      .filter(group => {
        // Filter out groups without geo coordinates
        if (!group.geo_location && !group.location) {
          return false;
        }
        return true;
      })
      .map(group => {
        // Get coordinates from the group data
        let lat, lng;
        if (group.geo_location && group.geo_location.coordinates && Array.isArray(group.geo_location.coordinates)) {
          // Using geo_location field (format may vary based on your database)
          [lng, lat] = group.geo_location.coordinates;
        } else {
          // Fallback for testing - random coordinates around the US
          lat = 37.0902 + (Math.random() - 0.5) * 10;
          lng = -95.7129 + (Math.random() - 0.5) * 20;
        }

        return {
          id: group.id,
          lat,
          lng,
          name: group.name,
          city: group.city || '',
          state: group.state || '',
          description: group.description || '',
          altitude: 0.01, // Small altitude to lift markers slightly off the globe
          radius: selectedGroupId === group.id ? 0.25 : 0.15, // Make selected marker larger
          color: getGroupColor(group),
          originalGroup: group, // Store the original group data for reference
        };
      });

    setPointsData(processedData);
  }, [groups, selectedGroupId]);

  // Focus the globe on a specific location
  useEffect(() => {
    if (initialCoordinates && globeRef.current) {
      const { lat, lng } = initialCoordinates;
      
      globeRef.current.pointOfView({
        lat,
        lng,
        altitude: 1.5, // Adjust as needed
      }, 1000); // 1000ms animation
    }
  }, [initialCoordinates, globeRef.current]);

  // Handle group selection on marker click
  const handlePointClick = (point: any) => {
    if (onGroupSelect && point.originalGroup) {
      onGroupSelect(point.originalGroup);

      // Fly to the clicked point
      if (globeRef.current) {
        globeRef.current.pointOfView({
          lat: point.lat,
          lng: point.lng,
          altitude: 1.2,
        }, 1000);
      }
    }
  };

  // Custom label rendering
  const customLabel = (point: any) => {
    return `
      <div style="
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        max-width: 200px;
        pointer-events: none;
      ">
        <div style="font-weight: bold; margin-bottom: 4px;">${point.name}</div>
        ${point.city ? `<div>${point.city}, ${point.state}</div>` : ''}
        ${point.description ? `<div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">${point.description.substring(0, 100)}${point.description.length > 100 ? '...' : ''}</div>` : ''}
      </div>
    `;
  };

  // Center the globe initially
  useEffect(() => {
    if (globeRef.current) {
      // Start with a nice view of the Earth
      globeRef.current.pointOfView({
        lat: 30,
        lng: -70,
        altitude: 2.5
      });
    }
  }, []);

  // Convert width and height to numbers if they are provided as percentages
  const numericWidth = typeof width === 'string' && width.endsWith('%') 
    ? undefined  // Let the container determine the width
    : typeof width === 'string' ? parseInt(width) : width;
  
  const numericHeight = typeof height === 'string' && height.endsWith('%') 
    ? undefined  // Let the container determine the height
    : typeof height === 'string' ? parseInt(height) : height;

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <Globe
        ref={globeRef}
        pointsData={pointsData}
        pointLabel={customLabel}
        pointLat="lat"
        pointLng="lng"
        pointRadius="radius"
        pointAltitude="altitude"
        pointColor="color"
        onPointClick={handlePointClick}
        pointsMerge={false}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="rgba(75,119,190,0.3)"
        enablePointerInteraction={true}
        width={numericWidth}
        height={numericHeight}
      />
    </div>
  );
};

export default GlobeComponent;