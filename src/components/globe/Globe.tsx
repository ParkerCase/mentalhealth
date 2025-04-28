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
}

export const GlobeComponent: React.FC<GlobeComponentProps> = ({ 
  height = '100vh', 
  width = '100%', 
  groups = [] 
}) => {
  const [imageryProvider, setImageryProvider] = useState<Cesium.ImageryProvider | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<Cesium.TerrainProvider | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const loadCesiumAssets = useCallback(async () => {
    try {
      // Use createWorldImagery and createWorldTerrain (non-async versions)
      const imagery = await Cesium.createWorldImagery();
      const terrain = await Cesium.createWorldTerrain();
      
      setImageryProvider(imagery);
      setTerrainProvider(terrain);
    } catch (error) {
      console.error('Error loading Cesium assets:', error);
      setLoadingError('Failed to load globe visualization');
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

  if (!imageryProvider || !terrainProvider) {
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
      <ImageryLayer
        imageryProvider={new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        })}
      />

      <Globe
        enableLighting={true}
        showGroundAtmosphere={true}
      />
    </Viewer>
  );
};

export default GlobeComponent;