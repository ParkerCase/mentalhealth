'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Viewer, Globe as ResiumGlobe, ImageryLayer, Entity } from 'resium';
import * as Cesium from 'cesium';
import AuroraEntity from './AuroraEntity';
import SunLight from './SunLight';
import MovingSatellites from './MovingSatellites';
import GroupMarkers from './GroupMarkers';
import CameraController from './CameraController';
import GlobeControls from './GlobeControls';
import WeatherEffects from './WeatherEffects';
import GlobeOptimizer from './GlobeOptimizer';
import { createCurvedPath, createFlightPathMaterial } from './GlobeUtils';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Define IonWorldImageryStyle if not present in Cesium
declare global {
  namespace Cesium {
    enum IonWorldImageryStyle {
      AERIAL = 'Aerial',
      AERIAL_WITH_LABELS = 'AerialWithLabels',
      ROAD = 'Road'
    }
  }
}

interface GlobeComponentProps {
  height?: string;
  width?: string;
  groups?: any[];
  onGroupSelect?: (group: any) => void;
  selectedGroupId?: string;
  initialCoordinates?: { lat: number; lng: number };
}

interface AdvancedGlobeProps {
  showSatellites?: boolean;
  showAtmosphere?: boolean;
  showTerrain?: boolean;
  performanceLevel?: 'low' | 'medium' | 'high' | 'ultra';
  weatherType?: 'clear' | 'clouds' | 'storm' | 'fog';
  weatherIntensity?: number;
  markerType?: 'pin' | 'dot' | 'pulse';
  autoRotate?: boolean;
  debugInfo?: boolean;
}

export const GlobeComponent: React.FC<GlobeComponentProps & AdvancedGlobeProps> = ({ 
  height = '100vh', 
  width = '100%', 
  groups = [],
  onGroupSelect,
  selectedGroupId,
  initialCoordinates,
  showSatellites = false,
  showAtmosphere = true,
  showTerrain = true,
  performanceLevel = 'medium',
  weatherType = 'clear',
  weatherIntensity = 0.5,
  markerType = 'pulse',
  autoRotate = false,
  debugInfo = false
}) => {
  const [imageryProvider, setImageryProvider] = useState<Cesium.ImageryProvider | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<any>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  // Load necessary Cesium assets
  const loadCesiumAssets = useCallback(async () => {
    try {
      // Load high-quality imagery - with fallback for different Cesium versions
      let imagery;
      try {
        // Try the newer API if available
        if (typeof Cesium.createWorldImagery === 'function') {
          imagery = Cesium.createWorldImagery({
            style: (Cesium as any).IonWorldImageryStyle?.AERIAL_WITH_LABELS || 'AerialWithLabels'
          });
        } else {
          // Fallback to basic URL template imagery provider
          imagery = new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          });
        }
      } catch (e) {
        console.warn('Error creating world imagery:', e);
        imagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        });
      }
      
      // Load terrain for elevation data - with fallback
      let terrain;
      try {
        if (typeof Cesium.createWorldTerrain === 'function') {
          terrain = Cesium.createWorldTerrain({
            requestVertexNormals: true,
            requestWaterMask: true
          });
        } else {
          terrain = new Cesium.EllipsoidTerrainProvider();
        }
      } catch (e) {
        console.warn('Error creating world terrain:', e);
        terrain = new Cesium.EllipsoidTerrainProvider();
      }
  
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
        
        const fallbackTerrain = new Cesium.EllipsoidTerrainProvider();
        
        setImageryProvider(fallbackImagery);
        setTerrainProvider(fallbackTerrain);
        setIsLoaded(true);
      } catch (e) {
        console.error('Failed to load fallback imagery:', e);
      }
    }
  }, []);

  // Configure the viewer when it's created
  const handleViewerMount = (viewer: Cesium.Viewer) => {
    if (!viewer) return;
    viewerRef.current = viewer;
    
    // Enable lighting based on sun position
    viewer.scene.globe.enableLighting = true;
    
    // Show atmosphere and space background
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.hueShift = 0.0;
      viewer.scene.skyAtmosphere.saturationShift = 0.1;
      viewer.scene.skyAtmosphere.brightnessShift = 0.1;
    }
    
    // Show sun
    if (viewer.scene.sun) {
      viewer.scene.sun.show = true;
    }
    
    // Show stars in the skybox
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = true;
    }
    
    // Set space background
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Enable anti-aliasing
    try {
      if (viewer.scene.postProcessStages?.fxaa) {
        viewer.scene.postProcessStages.fxaa.enabled = true;
      }
    } catch (e) {
      console.warn("FXAA not available:", e);
    }
    
    // Set minimum zoom distance
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000; // 100 km
    
    // Set time to now for proper sun positioning
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    
    // Configure shadows
    try {
      if (viewer.shadowMap) {
        viewer.shadowMap.enabled = true;
        viewer.shadowMap.softShadows = true;
      }
    } catch (e) {
      console.warn("Shadow maps not available:", e);
    }
    
    // Fly to initial coordinates if provided
    if (initialCoordinates) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates.lng,
          initialCoordinates.lat,
          1000000 // 1000 km altitude
        ),
        duration: 2
      });
    }
  };

  useEffect(() => {
    loadCesiumAssets();
    
    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
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
          Loading visualization...
        </div>
      </div>
    );
  }

  return (
    <Viewer
      full
      ref={(ref: any) => {
        if (ref?.cesiumElement) {
          handleViewerMount(ref.cesiumElement);
        }
      }}
      terrainProvider={terrainProvider}
      baseLayerPicker={false}
      sceneModePicker={false}
      timeline={false}
      animation={false}
      navigationHelpButton={false}
      homeButton={false}
      geocoder={false}
      fullscreenButton={false}
      vrButton={false}
      infoBox={false}
      selectionIndicator={false}
      style={{ height, width }}
    >
      {imageryProvider && (
        <ImageryLayer imageryProvider={imageryProvider} />
      )}

      <ResiumGlobe
        enableLighting={true}
        showGroundAtmosphere={true}
        depthTestAgainstTerrain={true}
      />
      
      {/* Add sun lighting */}
      <SunLight />
      
      {/* Add aurora effect at poles */}
      <AuroraEntity />
      
      {/* Add performance optimizer */}
      <GlobeOptimizer 
        performanceLevel={performanceLevel} 
        dynamicLighting={showAtmosphere}
        dynamicTerrain={showTerrain}
      />
      
      {/* Add weather effects */}
      <WeatherEffects
        type={weatherType}
        intensity={weatherIntensity}
        animate={true}
      />
      
      {/* Add satellites if enabled */}
      {showSatellites && (
        <MovingSatellites 
          count={3} 
          showLabels={true}
          showPaths={true}
        />
      )}
      
      {/* Add group markers */}
      <GroupMarkers 
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={onGroupSelect}
        markerType={markerType}
        colorByCategory={true}
      />
      
      {/* Flight paths between groups if selected */}
      {selectedGroupId && initialCoordinates && (() => {
        const selectedGroup = groups.find(g => g.id === selectedGroupId);
        if (selectedGroup) {
          const longitude = selectedGroup.geo_location?.coordinates?.[0] || 
            (-98.5795 + (Math.random() - 0.5) * 40);
          const latitude = selectedGroup.geo_location?.coordinates?.[1] || 
            (39.8283 + (Math.random() - 0.5) * 30);
          
          // Use the utility function to create curved path
          const pathPositions = createCurvedPath(
            initialCoordinates.lat,
            initialCoordinates.lng,
            latitude,
            longitude,
            300000 // Max height
          );
          
          // Create flight path material
          const pathMaterial = createFlightPathMaterial(
            Cesium.Color.BLUE,
            0.2,
            1.0
          );
          
          // Return Entity with the path
          return (
            <Entity
              polyline={{
                positions: pathPositions,
                width: 2,
                material: pathMaterial
              }}
            />
          );
        }
        return null;
      })()}
      
      {/* Auto-rotation camera controller */}
      {autoRotate && (
        <CameraController
          mode="rotate"
          enabled={autoRotate}
          rotateOptions={{
            speed: 0.05,
            altitude: 15000000
          }}
        />
      )}
      
      {/* Controls UI */}
      <GlobeControls
        enabledTools={['search', 'home', 'locate', 'settings']}
        onFlyTo={(lat, lng) => {
          if (viewerRef.current) {
            viewerRef.current.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lng, lat, 1000000),
              duration: 2
            });
          }
        }}
      />
      
      {/* Debug info display */}
      {debugInfo && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded">
          <div>Performance: {performanceLevel}</div>
          <div>Entities: {groups.length}</div>
          <div>Weather: {weatherType} ({weatherIntensity.toFixed(1)})</div>
          {viewerRef.current && (
            <div>FPS: {Math.round(30)}</div> // Simplified FPS display
          )}
        </div>
      )}
      
      {/* Add user location if provided */}
      {initialCoordinates && (
        <Entity
          position={Cesium.Cartesian3.fromDegrees(
            initialCoordinates.lng, 
            initialCoordinates.lat
          )}
          point={{
            pixelSize: 16,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }}
          label={{
            text: 'You are here',
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }}
        />
      )}
    </Viewer>
  );
};

export default GlobeComponent;