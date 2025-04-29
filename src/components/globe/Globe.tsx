'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Viewer, Globe, ImageryLayer, Entity } from 'resium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Configure Cesium Ion token
Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '';

interface GlobeComponentProps {
  height?: string;
  width?: string;
  groups?: any[];
  onGroupSelect?: (group: any) => void;
  selectedGroupId?: string;
  initialCoordinates?: { lat: number; lng: number };
}

export const GlobeComponent: React.FC<GlobeComponentProps> = ({ 
  height = '100vh', 
  width = '100%', 
  groups = [],
  onGroupSelect,
  selectedGroupId,
  initialCoordinates
}) => {
  const [imageryProvider, setImageryProvider] = useState<Cesium.ImageryProvider | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCesiumAssets = useCallback(async () => {
    try {
      // Use a simple URL template imagery provider as fallback
      const imagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      });
      
      // For terrain, use a simple EllipsoidTerrainProvider as Terrain is not available
      const terrain = new Cesium.EllipsoidTerrainProvider();
  
      setImageryProvider(imagery);
      setTerrainProvider(terrain);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading Cesium assets:', error);
      setLoadingError('Failed to load globe visualization');
  
      // Fallback to basic imagery if we can't load the high-quality assets
      try {
        const fallbackImagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        });
        setImageryProvider(fallbackImagery);
        setIsLoaded(true);
      } catch (e) {
        console.error('Failed to load fallback imagery:', e);
      }
    }
  }, []);
  

  useEffect(() => {
    loadCesiumAssets();
  }, [loadCesiumAssets]);

  // Render loading or error state
  if (loadingError) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-500">
        {loadingError}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400 tracking-widest text-xs uppercase">
          Loading Globe...
        </div>
      </div>
    );
  }

  return (
    <Viewer
      full
      baseLayerPicker={false}
      sceneModePicker={false}
      timeline={false}
      animation={false}
      navigationHelpButton={false}
      homeButton={false}
      geocoder={false}
      terrainProvider={terrainProvider}
      style={{ height, width }}
    >
      {imageryProvider && (
        <ImageryLayer imageryProvider={imageryProvider} />
      )}

      <Globe
        enableLighting={true}
        showGroundAtmosphere={true}
      />
      
      {/* Add your group entities here */}
      {groups && groups.length > 0 && groups.map((group, index) => {
        // Generate positions for the groups (similar to your original code)
        const longitude = -98.5795 + (Math.random() - 0.5) * 40;
        const latitude = 39.8283 + (Math.random() - 0.5) * 30;
        
        return (
          <Entity 
            key={group.id || index}
            position={Cesium.Cartesian3.fromDegrees(longitude, latitude)}
            point={{
              pixelSize: 12,
              color: selectedGroupId === group.id 
                ? Cesium.Color.BLUE 
                : Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
            }}
            onClick={() => onGroupSelect && onGroupSelect(group)}
          />
        );
      })}
      
      {/* Add user location if provided */}
      {initialCoordinates && (
        <Entity
          position={Cesium.Cartesian3.fromDegrees(
            initialCoordinates.lng, 
            initialCoordinates.lat
          )}
          point={{
            pixelSize: 16,
            color: Cesium.Color.BLUE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3
          }}
        />
      )}
    </Viewer>
  );
};

export default GlobeComponent;