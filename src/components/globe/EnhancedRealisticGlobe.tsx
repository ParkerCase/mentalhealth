'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Define props interface
export interface EnhancedGlobeProps {
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
  initialZoom?: 'close' | 'medium' | 'far';
}

const EnhancedRealisticGlobe: React.FC<EnhancedGlobeProps> = ({
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  autoRotate = true,
  initialZoom = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Calculate initial altitude based on zoom level
  const getInitialAltitude = () => {
    switch (initialZoom) {
      case 'close': return 6000000; // 6,000 km
      case 'far': return 25000000;  // 25,000 km
      case 'medium':
      default: return 15000000;     // 15,000 km
    }
  };

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    
    let isMounted = true;
    let rotationAnimation: ReturnType<typeof setInterval> | null = null;
    
    const createViewer = async () => {
      try {
        if (!Cesium.Ion.defaultAccessToken) {
          Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NjRjNGFmNi01Mjk4LTQyMzUtODEyOS02YWE5YjU3MjQ4NjgiLCJpZCI6MTc5MTc5LCJpYXQiOjE2OTg2MDM3NDB9.0M_G9DXhNFZTx2np4vXvECbgG5Lo7OQpRcyBuPjbhmA';
        }

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
          imageryProvider: new Cesium.TileMapServiceImageryProvider({
            url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          }),
          creditContainer: document.createElement('div')
        });
        
        if (!isMounted) return;
        
        viewerRef.current = viewer;
        
        // ======== ENHANCE EARTH REALISM ========
        
        // 1. Enable lighting and atmosphere
        viewer.scene.globe.enableLighting = true;
        
        // 2. Enhance atmosphere
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
          viewer.scene.skyAtmosphere.hueShift = 0.0;
          viewer.scene.skyAtmosphere.saturationShift = 0.1;
          viewer.scene.skyAtmosphere.brightnessShift = 0.1;
        }
        
        // 3. Show celestial bodies
        if (viewer.scene.sun) viewer.scene.sun.show = true;
        if (viewer.scene.moon) viewer.scene.moon.show = true;
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
        
        // 4. Enhance fog settings
        if (viewer.scene.fog) {
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.00001;
          viewer.scene.fog.screenSpaceErrorFactor = 4.0;
        }
        
        // 5. Night lights enhancement
        try {
          // @ts-ignore
          viewer.scene.globe.nightColorBrightness = 3.0;
        } catch (e) {
          console.warn('Could not set nightColorBrightness:', e);
        }
        
        // 6. Add water effect
        try {
          viewer.scene.globe.showGroundAtmosphere = true;
          viewer.scene.globe.baseColor = Cesium.Color.BLUE.brighten(0.6, new Cesium.Color());
          // @ts-ignore
          viewer.scene.globe.oceanColor = Cesium.Color.BLUE.brighten(0.5, new Cesium.Color());
        } catch (e) {
          console.warn('Could not enhance water effect:', e);
        }
        
        // ======== CAMERA SETUP ========
        
        const initialAltitude = getInitialAltitude();
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            initialCoordinates?.lng || -98.5795,
            initialCoordinates?.lat || 39.8283,
            initialAltitude
          ),
          duration: 0
        });
        
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1500000;
        
        // ======== MARKERS SETUP ========
        
        groups.forEach(group => {
          if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return;
          
          const lng = group.geo_location.coordinates[0];
          const lat = group.geo_location.coordinates[1];
          const isSelected = selectedGroupId === group.id;
          
          // Create pulse effect entities
          const glowSize = isSelected ? 125000 : 75000;
          
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
            ellipse: {
              semiMinorAxis: glowSize,
              semiMajorAxis: glowSize,
              height: 0,
              material: new Cesium.ColorMaterialProperty(
                isSelected 
                  ? Cesium.Color.YELLOW.withAlpha(0.3) 
                  : Cesium.Color.CYAN.withAlpha(0.3)
              ),
              outline: true,
              outlineColor: isSelected ? Cesium.Color.YELLOW.withAlpha(0.7) : Cesium.Color.CYAN.withAlpha(0.7),
              outlineWidth: 3
            }
          });
          
          viewer.entities.add({
            id: group.id,
            name: group.name,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
              pixelSize: isSelected ? 15 : 10,
              color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
            },
            label: {
              text: group.name,
              font: '14px sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              show: isSelected
            }
          });
        });
        
        // ======== EVENT HANDLERS ========
        
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
        
        // ======== ROTATION SETUP ========
        
        const startRotation = () => {
          let rotationRate = 0.05; // degrees per second
          
          const tick = () => {
            if (!viewer || viewer.isDestroyed() || !autoRotate || selectedGroupId) {
              return;
            }
            
            // Get current camera view
            const camera = viewer.camera;
            
            // Rotate around the z-axis (longitude rotation)
            camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(rotationRate / 60.0));
            
            // Update clock for day/night cycle 
            const currentTime = viewer.clock.currentTime;
            viewer.clock.currentTime = Cesium.JulianDate.addSeconds(currentTime, 0.5, new Cesium.JulianDate());
          };
          
          viewer.clock.onTick.addEventListener(tick);
          
          // Store the animation for cleanup
          rotationAnimation = setInterval(() => {
            viewer.clock.tick();
          }, 1000 / 60);
        };
        
        // Start rotation after a short delay
        setTimeout(() => {
          if (isMounted && autoRotate && !selectedGroupId) {
            startRotation();
          }
        }, 1000);
        
        setIsReady(true);
        console.log("Enhanced globe ready");
      } catch (error) {
        console.error("Error creating enhanced viewer:", error);
      }
    };
    
    createViewer();
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      if (rotationAnimation) {
        clearInterval(rotationAnimation);
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

  // Handle rotation when autoRotate or selectedGroupId changes
  useEffect(() => {
    if (!viewerRef.current || !isReady) return;
    
    // The rotation logic is now in the main animation loop
    // This effect is mainly to ensure the component re-renders when props change
  }, [autoRotate, selectedGroupId, isReady]);

  return (
    <div style={{ 
      width: width, 
      height: height, 
      position: 'relative',
      overflow: 'hidden'
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

export default EnhancedRealisticGlobe;