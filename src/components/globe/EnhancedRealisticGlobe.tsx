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
  initialZoom?: 'close' | 'medium' | 'far'; // New prop to control initial zoom level
}

// Enhanced version with better visuals and performance
const EnhancedRealisticGlobe: React.FC<EnhancedGlobeProps> = ({
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  autoRotate = true,
  initialZoom = 'medium' // Default to medium zoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isNightTexture, setIsNightTexture] = useState<boolean>(false);
  const [cloudsLayer, setCloudsLayer] = useState<Cesium.ImageryLayer | null>(null);
  
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
    
    console.log("Creating enhanced Cesium viewer...");
    
    try {
      // Try to use a default token if none is set
      if (!Cesium.Ion.defaultAccessToken) {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NjRjNGFmNi01Mjk4LTQyMzUtODEyOS02YWE5YjU3MjQ4NjgiLCJpZCI6MTc5MTc5LCJpYXQiOjE2OTg2MDM3NDB9.0M_G9DXhNFZTx2np4vXvECbgG5Lo7OQpRcyBuPjbhmA';
      }

      // Create viewer with improved configuration
      const viewer = new Cesium.Viewer(containerRef.current, {
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
        // Create a more realistic looking Earth by default
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        }),
        creditContainer: document.createElement('div')
      });
      
      viewerRef.current = viewer;
      
      // ======== ENHANCE EARTH REALISM ========
      
      // 1. Enable lighting and atmosphere for more realism
      viewer.scene.globe.enableLighting = true;
      
      // 2. Enhance atmosphere
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 0.1;
      }
      
      // 3. Show celestial bodies
      if (viewer.scene.sun) {
        viewer.scene.sun.show = true;
      }
      if (viewer.scene.moon) {
        viewer.scene.moon.show = true;
      }
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = true;
      }
      
      // 4. Enhance fog settings for a more realistic horizon
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.00001; // Subtle fog effect
        viewer.scene.fog.screenSpaceErrorFactor = 4.0;
      }
      
      // 5. Try to load night lights texture for Earth
      try {
        // Load night imagery for cities at night effect
        const nightImagery = new Cesium.SingleTileImageryProvider({
          url: 'public/assets/earth-night.jpg', // Make sure this file exists
          rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
        });
        
        // Add night imagery as a separate layer with lower brightness
        const nightLayer = viewer.scene.imageryLayers.addImageryProvider(nightImagery);
        nightLayer.alpha = 0.0; // Start with invisible night layer
        nightLayer.brightness = 1.5; // Make night lights a bit brighter
        nightLayer.contrast = 1.2; // Increase contrast to make lights pop
        
        // Store reference for day/night cycle updates
        setIsNightTexture(true);
      } catch (e) {
        console.warn('Could not load night imagery, using default night enhancement:', e);
        
        // Fallback method: enhance globe's nightColorBrightness if available
        try {
          // @ts-ignore: Property exists at runtime but might not be in type definitions
          viewer.scene.globe.nightColorBrightness = 3.0;
        } catch (e) {
          console.warn('Could not set nightColorBrightness:', e);
        }
      }
      
      // 6. Add water effect if available
      try {
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.globe.baseColor = Cesium.Color.BLUE.brighten(0.6, new Cesium.Color());
        // Use ts-ignore to bypass TypeScript error for oceanColor
        // @ts-ignore: Property may exist at runtime but not in type definitions
        viewer.scene.globe.oceanColor = Cesium.Color.BLUE.brighten(0.5, new Cesium.Color());
      } catch (e) {
        console.warn('Could not enhance water effect:', e);
      }
      
      // 7. Add cloud layer with animation
      try {
        // Load cloud texture overlay
        const cloudsImagery = new Cesium.SingleTileImageryProvider({
          url: '/../assets/cloud.png', // Make sure this exists and is a transparent PNG
          rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
        });
        
        // Add clouds as a separate layer with partial transparency
        const clouds = viewer.scene.imageryLayers.addImageryProvider(cloudsImagery);
        clouds.alpha = 0.5; // Semi-transparent clouds
        clouds.brightness = 1.2; // Slightly brighter
        clouds.contrast = 1.1; // Slightly more contrast
        
        // Store reference for animation
        setCloudsLayer(clouds);
        
        // Animate clouds slowly by shifting the texture over time
        let cloudsOffset = 0.0;
        viewer.scene.preRender.addEventListener(() => {
          cloudsOffset += 0.0001; // Very slow movement
          if (cloudsOffset > 1.0) cloudsOffset = 0.0;
          
          // Apply the offset to create animation
          // @ts-ignore: Some properties might not be in type definitions
          if (clouds && clouds.dayAlpha !== undefined) {
            // @ts-ignore
            clouds.dayAlpha = 0.6; // Visibility during day
            // @ts-ignore
            clouds.nightAlpha = 0.3; // Less visible at night
            // Apply texture offsets to create movement
            // @ts-ignore
            if (clouds._textureCoordinateOffsetMatrix) {
              // @ts-ignore
              clouds._textureCoordinateOffsetMatrix[2] = cloudsOffset;
              // @ts-ignore
              clouds._textureCoordinateOffsetMatrix[5] = 0.0;
            }
          }
        });
      } catch (e) {
        console.warn('Could not add cloud layer:', e);
      }
      
      // ======== CAMERA SETUP ========
      
      // Set up initial view
      const initialAltitude = getInitialAltitude();
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates?.lng || -98.5795,
          initialCoordinates?.lat || 39.8283,
          initialAltitude
        ),
        duration: 0
      });
      
      // Set minimum zoom distance to prevent getting too close
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1500000; // 1,500 km
      
      // ======== MARKERS SETUP ========
      
      // Add glowing markers for each group
      groups.forEach(group => {
        if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return;
        
        const lng = group.geo_location.coordinates[0];
        const lat = group.geo_location.coordinates[1];
        const isSelected = selectedGroupId === group.id;
        
        // Create pulse effect entities
        const glowSize = isSelected ? 125000 : 75000; // Size in meters
        
        // Add a glowing circle for each marker
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
        
        // Add the main marker
        const entity = viewer.entities.add({
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
      
      console.log(`Added ${groups.length} enhanced markers to scene`);
      
      // ======== EVENT HANDLERS ========
      
      // Set up click handler for group selection
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
      
      // ======== ANIMATION & ROTATION ========
      
      // Set up smooth rotation animation with day/night cycle
      if (autoRotate && !selectedGroupId) {
        const startRotation = () => {
          if (!viewer || viewer.isDestroyed()) return;
          
          let lastTime = Date.now();
          let spinRate = 0.03; // slower degrees per second - very slow rotation
          
          const rotate = () => {
            if (!viewer || viewer.isDestroyed()) return;
            
            // Get time delta
            const now = Date.now();
            const delta = now - lastTime;
            lastTime = now;
            
            // Only update if enough time has passed (throttle updates)
            if (delta > 0) {
              // Calculate rotation amount based on time
              const rotationAmount = (spinRate * delta) / 1000;
              
              // Get current camera position
              const cameraPosition = viewer.camera.position;
              
              // Calculate rotation around Earth's center
              const center = Cesium.Cartesian3.ZERO;
              
              // Create rotation matrix around Y axis
              const rotationMatrix = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rotationAmount));
              
              // Apply rotation to camera position
              const rotatedPosition = Cesium.Matrix3.multiplyByVector(
                rotationMatrix, 
                cameraPosition, 
                new Cesium.Cartesian3()
              );
              
              // Maintain same distance from center
              const distance = Cesium.Cartesian3.magnitude(cameraPosition);
              Cesium.Cartesian3.normalize(rotatedPosition, rotatedPosition);
              Cesium.Cartesian3.multiplyByScalar(rotatedPosition, distance, rotatedPosition);
              
              // Update camera if the calculation is valid
              if (!isNaN(rotatedPosition.x) && !isNaN(rotatedPosition.y) && !isNaN(rotatedPosition.z)) {
                viewer.camera.position = rotatedPosition;
                
                // Ensure camera still looks at Earth's center
                viewer.camera.direction = Cesium.Cartesian3.negate(
                  Cesium.Cartesian3.normalize(rotatedPosition, new Cesium.Cartesian3()),
                  new Cesium.Cartesian3()
                );
                
                // Update lighting to show day/night cycle
                const currentTime = viewer.clock.currentTime;
                const newTime = Cesium.JulianDate.addSeconds(
                  currentTime, 
                  delta / 10, // Accelerate time for visible day/night cycle
                  new Cesium.JulianDate()
                );
                viewer.clock.currentTime = newTime;
              }
            }
            
            // Continue animation
            animationRef.current = requestAnimationFrame(rotate);
          };
          
          // Start animation loop
          animationRef.current = requestAnimationFrame(rotate);
        };
        
        // Start rotation after a brief delay to let the scene stabilize
        setTimeout(startRotation, 1000);
      }
      
      console.log("Enhanced globe ready - should be rotating slowly with day/night and cloud effects");
    } catch (error) {
      console.error("Error creating enhanced viewer:", error);
    }

    // Cleanup function
    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
          viewerRef.current = null;
          console.log("Enhanced viewer destroyed");
        } catch (e) {
          console.error("Error destroying viewer:", e);
        }
      }
    };
  }, [groups, selectedGroupId, initialCoordinates, onGroupSelect, autoRotate, initialZoom]);

  // Effect to update rotation when autoRotate or selectedGroupId changes
  useEffect(() => {
    // Stop rotation if a group is selected or autoRotate is false
    if (animationRef.current && (!autoRotate || selectedGroupId)) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    // We don't restart rotation here as it's complex - it will restart on the next render if needed
  }, [autoRotate, selectedGroupId]);

  return (
    <div style={{ 
      width: width, 
      height: height, 
      position: 'relative',
      overflow: 'hidden' // Prevent any overflow issues
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