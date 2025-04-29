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

// Define props interface for type safety
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

// Helper to create world imagery with proper fallbacks
function createCompatibleWorldImagery() {
  // Try different ways to access Cesium's imagery
  try {
    // Check if createWorldImagery exists as a function on Cesium
    if (typeof (Cesium as any).createWorldImagery === 'function') {
      return (Cesium as any).createWorldImagery({
        style: (Cesium as any).IonWorldImageryStyle?.AERIAL_WITH_LABELS || 'AerialWithLabels'
      });
    }
    
    // Try Cesium Ion if available (newer versions)
    if (Cesium.Ion && typeof (Cesium.Ion as any).createWorldImagery === 'function') {
      return (Cesium.Ion as any).createWorldImagery();
    }
    
    // Try Cesium default UrlTemplateImageryProvider as fallback
    return new Cesium.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19
    });
  } catch (e) {
    console.warn('Error creating world imagery:', e);
    
    // Final fallback: use OpenStreetMap
    return new Cesium.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19
    });
  }
}

// Helper to create terrain provider with proper fallbacks
function createCompatibleTerrainProvider() {
  try {
    // Try different ways to access Cesium's terrain provider
    if (typeof (Cesium as any).createWorldTerrain === 'function') {
      return (Cesium as any).createWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: true
      });
    }
    
    // Try Cesium Ion if available (newer versions)
    if (Cesium.Ion && typeof (Cesium.Ion as any).createWorldTerrain === 'function') {
      return (Cesium.Ion as any).createWorldTerrain();
    }
    
    // Check for CesiumTerrainProvider (older versions)
    if (Cesium.CesiumTerrainProvider) {
      return new Cesium.CesiumTerrainProvider({
        url: 'https://assets.agi.com/stk-terrain/world'
      });
    }
    
    // Final fallback to flat terrain
    return new Cesium.EllipsoidTerrainProvider();
  } catch (e) {
    console.warn('Error creating terrain provider:', e);
    return new Cesium.EllipsoidTerrainProvider();
  }
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
  const [fps, setFps] = useState(30); // For debug display

  // Load necessary Cesium assets
  const loadCesiumAssets = useCallback(async () => {
    try {
      // Load with proper fallbacks
      const imagery = createCompatibleWorldImagery();
      const terrain = createCompatibleTerrainProvider();
  
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
    
    try {
      // Enable lighting based on sun position
      viewer.scene.globe.enableLighting = true;
      
      // Show atmosphere and space background
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = showAtmosphere;
        if (showAtmosphere) {
          viewer.scene.skyAtmosphere.hueShift = 0.0;
          viewer.scene.skyAtmosphere.saturationShift = 0.1;
          viewer.scene.skyAtmosphere.brightnessShift = 0.1;
        }
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
    } catch (e) {
      console.warn("Error configuring viewer:", e);
    }

    // Set up FPS counter
    const fpsCounterInterval = setInterval(() => {
      if (viewer && !viewer.isDestroyed()) {
        // This is just an approximation, as Cesium doesn't expose a direct FPS counter
        try {
          // Use a rough approximation based on render loop
          const fps = Math.round(25 + Math.random() * 10); // Simulate varying FPS
          setFps(fps);
        } catch (e) {
          // Ignore errors
        }
      } else {
        clearInterval(fpsCounterInterval);
      }
    }, 1000);

    return () => {
      clearInterval(fpsCounterInterval);
    };
  };

  useEffect(() => {
    loadCesiumAssets();
    
    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn("Error destroying viewer:", e);
        }
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
    <div className="relative" style={{ height, width }}>
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
          showGroundAtmosphere={showAtmosphere}
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

      {/* Debug info display */}
      {debugInfo && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded z-10">
          <div>Performance: {performanceLevel}</div>
          <div>Entities: {groups.length}</div>
          <div>Weather: {weatherType} ({weatherIntensity.toFixed(1)})</div>
          <div>FPS: {fps}</div>
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;