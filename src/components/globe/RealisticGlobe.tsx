'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Viewer, Entity, ImageryLayer, Globe } from 'resium';
import * as Cesium from 'cesium';
import CameraController from './CameraController';
import SunLight from './SunLight';
import GlobeOptimizer from './GlobeOptimizer';
import WeatherEffects from './WeatherEffects';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface GroupData {
  id: string;
  name: string;
  geo_location?: {
    type?: string;
    coordinates: number[] | [number, number]; // More flexible: accepts both array and tuple
  };
  city?: string;
  state?: string;
}

interface RealisticGlobeProps {
  // Basic customization
  height?: string;
  width?: string;
  
  // Data for markers
  groups?: GroupData[];
  selectedGroupId?: string;
  onGroupSelect?: (group: GroupData) => void;
  
  // Initial view settings
  initialCoordinates?: { lat: number; lng: number };
  initialAltitude?: number;
  
  // Globe behavior
  autoRotate?: boolean;
  performanceLevel?: 'low' | 'medium' | 'high' | 'ultra';
  
  // Visual effects
  showSatellites?: boolean;
  weatherType?: 'clear' | 'clouds' | 'storm' | 'fog';
  weatherIntensity?: number;
  markerType?: 'pin' | 'dot' | 'pulse';
  
  // Debug options
  debugInfo?: boolean;
}

const RealisticGlobe: React.FC<RealisticGlobeProps> = ({
  // Default values for all props
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  initialAltitude = 10000000,
  autoRotate = true,
  performanceLevel = 'medium',
  showSatellites = false,
  weatherType = 'clear',
  weatherIntensity = 0.5,
  markerType = 'pulse',
  debugInfo = false
}) => {
  // State for imagery provider and viewer reference
  const [imageryProvider, setImageryProvider] = useState<Cesium.ImageryProvider | null>(null);
  const [isImageryReady, setIsImageryReady] = useState(false);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle imagery loading
  const loadImagery = useCallback(async () => {
    try {
      // First try OpenStreetMap provider (doesn't require authentication)
      const osmProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      });
      setImageryProvider(osmProvider);
      setIsImageryReady(true);
      console.log("✅ OpenStreetMap imagery loaded successfully");
      
      // Then try to load Cesium World Imagery as a better alternative if token is valid
      try {
        const imagery = await Cesium.createWorldImageryAsync({
          style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
        });
        // If we get here, token is valid, switch to better imagery
        setImageryProvider(imagery);
        setIsImageryReady(true);
        console.log("✅ Cesium world imagery loaded successfully");
      } catch (ionError) {
        // Continue using OpenStreetMap, no need to report error since we have a fallback
        console.log("ℹ️ Using OpenStreetMap imagery (Cesium Ion unavailable)");
      }
    } catch (error) {
      console.error("Failed to load any imagery:", error);
      setErrorMsg("Failed to load globe imagery");
    }
  }, []);

  // Handle viewer initialization and configuration
  const handleViewerMounted = (viewer: Cesium.Viewer) => {
    if (!viewer) return;
    
    viewerRef.current = viewer;
    const scene = viewer.scene;
    const globe = scene.globe;
    
    // Critical: Ensure globe is visible
    globe.show = true;
    
    // Set base color when tiles aren't loaded yet
    globe.baseColor = Cesium.Color.DARKBLUE;
    
    // Configure lighting
    globe.enableLighting = true;
    
    // Prevent depth testing against terrain for better marker visibility
    globe.depthTestAgainstTerrain = false;
    
    // Configure the scene background
    scene.backgroundColor = Cesium.Color.BLACK;
    
    // Show sky atmosphere
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
    }
    
    // Show sun and stars
    if (scene.sun) scene.sun.show = true;
    if (scene.skyBox) scene.skyBox.show = true;
    
    // Set the clock to current time
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.shouldAnimate = true;
    
    // Configure anti-aliasing
    if (scene.postProcessStages?.fxaa) {
      scene.postProcessStages.fxaa.enabled = true;
    }
    
    // Force the scene to render after configuration
    scene.requestRender();
    
    // Debug info
    if (debugInfo) {
      console.log("Viewer configuration complete:", {
        globeShow: globe.show,
        lightingEnabled: globe.enableLighting,
        imageryProvider: !!imageryProvider,
        clockTime: viewer.clock.currentTime.toString()
      });
    }
  };

  // Initialize Cesium
  useEffect(() => {
    // Create a stable credit container element that won't change between renders
    const stableCreditsContainer = document.createElement('div');
    stableCreditsContainer.style.display = 'none'; // Hide credits
    document.body.appendChild(stableCreditsContainer);
    
    // Set Ion token
    if (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
      try {
        Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        console.log("✅ Cesium Ion token set");
      } catch (e) {
        console.warn("⚠️ Failed to set Cesium Ion token:", e);
      }
    } else {
      console.warn("⚠️ No Cesium Ion token found in environment variables");
      // Set a default token that allows basic functionality (Cesium's default)
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTdlZGJlMi00Y2JjLTQyMjEtOGVmOS1hNjE4MTEyZTYwZmQiLCJpZCI6MTQ1MSwiaWF0IjoxNjA4ODkwMjQ0fQ.Wk0FfA5YxB9lGYJtQHY3h-USVWRlEPRYCrmEqbGlaGs';
    }
    
    // Load imagery
    loadImagery();
    
    // Cleanup function
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.destroy();
          viewerRef.current = null;
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
      }
      
      // Remove the credit container element
      if (stableCreditsContainer.parentNode) {
        stableCreditsContainer.parentNode.removeChild(stableCreditsContainer);
      }
    };
  }, [loadImagery]);

  // Handle initial coordinates flight
  useEffect(() => {
    if (viewerRef.current && initialCoordinates) {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates.lng,
          initialCoordinates.lat,
          initialAltitude
        ),
        duration: 2,
      });
    }
  }, [initialCoordinates, initialAltitude, isImageryReady]);

  // Create entities for group markers
  const renderGroupMarkers = () => {
    return groups.map((group) => {
      if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return null;
      
      // Safely extract longitude and latitude regardless of array type
      const lng = group.geo_location.coordinates[0];
      const lat = group.geo_location.coordinates[1];
      const isSelected = selectedGroupId === group.id;
      
      // Create marker based on type
      let pointOptions: Cesium.PointGraphics.ConstructorOptions = {
        pixelSize: isSelected ? 12 : 8,
        color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      };
      
      // Customize marker appearance based on type
      if (markerType === 'pulse') {
        pointOptions = {
          ...pointOptions,
          pixelSize: isSelected ? 15 : 10,
          color: isSelected 
            ? Cesium.Color.YELLOW.withAlpha(0.8) 
            : Cesium.Color.CYAN.withAlpha(0.8),
        };
      }
      
      return (
        <Entity
          key={group.id}
          name={group.name}
          position={Cesium.Cartesian3.fromDegrees(lng, lat)}
          point={pointOptions}
          label={{
            text: group.name,
            font: '14px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            show: isSelected || false,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }}
          onClick={() => onGroupSelect?.(group)}
        />
      );
    });
  };

  // Render the component
  return (
    <div style={{ height, width, position: 'relative' }}>
      {/* Error message overlay if needed */}
      {errorMsg && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div>
            <h3>Error Loading Globe</h3>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}
      
      {/* Cesium Viewer */}
      <Viewer
        full
        ref={(ref: any) => {
          if (ref?.cesiumElement) {
            handleViewerMounted(ref.cesiumElement);
          }
        }}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        selectionIndicator={false}
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        creditContainer={document.createElement('div')} // Create a new element each time to avoid ref issues
        terrainProvider={new Cesium.EllipsoidTerrainProvider()}
        requestRenderMode={true}
        maximumRenderTimeChange={Infinity}
        scene3DOnly={true}
      >
        {/* Configure the globe */}
        <Globe enableLighting={true} />
        
        {/* Add imagery layer once loaded */}
        {imageryProvider && (
          <ImageryLayer
            imageryProvider={imageryProvider}
            alpha={1.0}
            brightness={1.0}
          />
        )}
        
        {/* Add sun lighting */}
        <SunLight />
        
        {/* Add performance optimizations */}
        <GlobeOptimizer 
          performanceLevel={performanceLevel}
          dynamicLighting={true}
        />
        
        {/* Add weather effects if not clear */}
        {weatherType !== 'clear' && (
          <WeatherEffects 
            type={weatherType}
            intensity={weatherIntensity}
          />
        )}
        
        {/* Add camera controller for rotation */}
        {autoRotate && (
          <CameraController 
            mode="rotate"
            enabled={true}
            rotateOptions={{ 
              speed: 0.05, 
              altitude: initialAltitude 
            }}
          />
        )}
        
        {/* Render group markers */}
        {renderGroupMarkers()}
      </Viewer>
      
      {/* Optional debug info */}
      {debugInfo && (
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 10, 
            left: 10, 
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '5px 10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px'
          }}
        >
          <div>Imagery Loaded: {isImageryReady ? 'Yes' : 'No'}</div>
          <div>Groups: {groups.length}</div>
          <div>Performance: {performanceLevel}</div>
          <div>Weather: {weatherType}</div>
        </div>
      )}
    </div>
  );
};

export default RealisticGlobe;