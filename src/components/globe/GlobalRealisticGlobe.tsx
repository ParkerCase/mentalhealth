// src/components/globe/GlobalRealisticGlobe.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
// Add this near the top of your component with other useRef declarations
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export interface GlobalRealisticGlobeProps {
  height?: string;
  width?: string;
  groups?: Array<{
    id: string;
    name: string;
    geo_location?: {
      type?: string;
      coordinates: number[];
    };
    city?: string;
    state?: string;
  }>;
  selectedGroupId?: string;
  onGroupSelect?: (group: any) => void;
  initialCoordinates?: { lat: number; lng: number };
  autoRotate?: boolean;
  performanceLevel?: 'low' | 'medium' | 'high' | 'ultra';
}

const GlobalRealisticGlobe: React.FC<GlobalRealisticGlobeProps> = ({
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  autoRotate = true,
  performanceLevel = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const animationRef = useRef<number | null>(null);
  const earthRotationSpeed = useRef(0.02); // degrees per frame
  const earthRotationAngle = useRef(0);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    
    let isInitialized = false;


    
    const createViewer = () => {
      try {
        // Create hidden credits container
        const credits = document.createElement('div');
        credits.style.display = 'none';
        
        // Create custom imagery provider collection
        const imageryLayers = new Cesium.ImageryLayerCollection();
        
        // Create the viewer with configuration
        const viewer = new Cesium.Viewer(containerRef.current!, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          creditContainer: credits,
          imageryProvider: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          ...({requestRenderMode: true, maximumRenderTimeChange: Infinity} as any)
        });
        
        viewerRef.current = viewer;
        const scene = viewer.scene;
        const globe = scene.globe;
        
        // Configure viewer basics
        scene.backgroundColor = Cesium.Color.BLACK;
        globe.enableLighting = true;
        
        // Enhanced day/night cycle settings
        globe.baseColor = Cesium.Color.fromCssColorString('#5A7A9D').brighten(0.2, new Cesium.Color()); // More vibrant ocean color
        globe.showGroundAtmosphere = true;
        
        if (scene.sun) {
          scene.sun.show = true;
          scene.sun.glowFactor = 0.8; // Make the sun glow more prominent
        }
        
        if (scene.skyAtmosphere) {
          scene.skyAtmosphere.show = true;
          scene.skyAtmosphere.hueShift = 0.0;
          scene.skyAtmosphere.saturationShift = 0.3; // Increased saturation for more vibrant colors
          scene.skyAtmosphere.brightnessShift = 0.2; // Increased brightness for better daylight appearance
        }

        
        
        // Add custom imagery layers
        try {
          // 1. Base earth texture
          const baseImagery = new Cesium.SingleTileImageryProvider({
            url: '/assets/earth-map.jpg',
            rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
          });
          
          const baseLayer = viewer.imageryLayers.addImageryProvider(baseImagery);
          baseLayer.brightness = 1.2; // Brighter for daytime
          baseLayer.contrast = 1.1; // Better contrast
          
          // 2. Night lights
          const nightLights = new Cesium.SingleTileImageryProvider({
            url: '/assets/earth-night.jpg',
            rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
          });
          
          const nightLayer = viewer.imageryLayers.addImageryProvider(nightLights, 1);
          nightLayer.alpha = 0.8; // Start with visible night lights
          
          // 3. Clouds
          const cloudProvider = new Cesium.SingleTileImageryProvider({
            url: '/assets/earth-clouds.png',
            rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
          });
          
          const cloudLayer = viewer.imageryLayers.addImageryProvider(cloudProvider, 2);
          cloudLayer.alpha = 0.5; // More visible clouds
          cloudLayer.brightness = 1.1;
          
          // Enhanced day/night cycle based on earth rotation
          viewer.clock.onTick.addEventListener(() => {
            if (nightLayer && baseLayer) {
              // Use the tracked rotation angle to determine day/night
              const seconds = Date.now() / 1000;
              const rotationPhase = (seconds * 0.01) % (Math.PI * 2);
              
              // Calculate alpha based on phase
              const nightAlpha = Math.max(0.1, Math.min(0.8, 0.5 + Math.sin(rotationPhase) * 0.7));
              nightLayer.alpha = nightAlpha;
              
              // Adjust base layer brightness for day/night
              baseLayer.brightness = 1.2 - (nightAlpha * 0.3);
              baseLayer.contrast = 1.1 + (nightAlpha * 0.2);
            }
          });
          
        } catch (error) {
          console.error('Error setting up custom imagery:', error);
          const defaultProvider = new Cesium.TileMapServiceImageryProvider({
            url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          });
          viewer.imageryLayers.addImageryProvider(defaultProvider);
        }
        
        // Configure performance settings
        setupPerformanceSettings(viewer, performanceLevel);
        
        // Set initial camera position - look at Earth from a distance
        const distance = initialCoordinates ? 5000000 : 15000000;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            initialCoordinates?.lng || 0,
            initialCoordinates?.lat || 0,
            distance
          ),
          orientation: {
            heading: 0,
            pitch: -Math.PI / 2, // Look down at Earth
            roll: 0
          }
        });
        
        // Set up earth rotation instead of camera rotation
        setupEarthRotation(viewer);
        
        // Add markers for each group
        groups.forEach(group => {
          if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return;
          
          const lng = group.geo_location.coordinates[0];
          const lat = group.geo_location.coordinates[1];
          const isSelected = selectedGroupId === group.id;
          
          viewer.entities.add({
            id: group.id,
            name: group.name,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
              pixelSize: isSelected ? 15 : 10,
              color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
              text: group.name,
              font: '14px sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              show: isSelected,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        });
        
        // Set up click handler
        if (onGroupSelect) {
          handlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
          handlerRef.current.setInputAction((click: any) => {
            const pickedObject = viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObject) && pickedObject.id) {
              const entity = pickedObject.id;
              const selectedGroup = groups.find(g => g.id === entity.id);
              if (selectedGroup) {
                onGroupSelect(selectedGroup);
              }
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
        
        isInitialized = true;
        console.log("Globe initialized with custom textures");
        
      } catch (error) {
        console.error("Error creating viewer:", error);
      }
    };
    
    createViewer();
    
    // Cleanup function
    return () => {
      isInitialized = false;
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);
  
  // Effect to manage rotation based on autoRotate and selectedGroupId
  useEffect(() => {
    if (viewerRef.current && autoRotate && !selectedGroupId) {
      startEarthRotation();
    } else {
      stopEarthRotation();
    }
  }, [autoRotate, selectedGroupId]);

  const setupEarthRotation = (viewer: Cesium.Viewer) => {
    let rotationAngle = 0;
    
    const tick = () => {
      if (!viewer.isDestroyed()) {
        // Rotate the camera around the globe
        rotationAngle += Cesium.Math.toRadians(earthRotationSpeed.current);
        earthRotationAngle.current = rotationAngle; // Track the rotation
        
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(earthRotationSpeed.current));
        
        animationRef.current = requestAnimationFrame(tick);
      }
    };
    
    if (autoRotate && !selectedGroupId) {
      animationRef.current = requestAnimationFrame(tick);
    }
  };

  const startEarthRotation = () => {
    if (!animationRef.current && viewerRef.current) {
      setupEarthRotation(viewerRef.current);
    }
  };

  const stopEarthRotation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const setupPerformanceSettings = (viewer: Cesium.Viewer, level: string) => {
    const scene = viewer.scene;
    const globe = scene.globe;
    
    switch (level) {
      case 'low':
        if (scene.fog) scene.fog.enabled = false;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
        globe.enableLighting = false;
        globe.maximumScreenSpaceError = 4;
        break;
      case 'high':
      case 'ultra':
        if (scene.fog) scene.fog.enabled = true;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
        globe.enableLighting = true;
        globe.maximumScreenSpaceError = 1;
        try {
          if (scene.postProcessStages?.fxaa) {
            scene.postProcessStages.fxaa.enabled = true;
          }
        } catch (e) {
          console.warn("FXAA not available:", e);
        }
        break;
      case 'medium':
      default:
        if (scene.fog) scene.fog.enabled = true;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
        globe.enableLighting = true;
        globe.maximumScreenSpaceError = 2;
        break;
    }
  };

  return (
    <div style={{ 
      width: width, 
      height: height, 
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />
    </div>
  );
};

export default GlobalRealisticGlobe;