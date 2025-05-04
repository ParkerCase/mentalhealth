'use client';

import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Define props interface
interface RealisticGlobeProps {
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
  weatherType?: 'clear' | 'clouds' | 'storm' | 'fog';
  weatherIntensity?: number;
  performanceLevel?: 'low' | 'medium' | 'high' | 'ultra';
  showSatellites?: boolean;
  markerType?: 'pin' | 'dot' | 'pulse';
  debugInfo?: boolean;
}

// Fixed version with NO dependency on local assets
const RealisticGlobePerformance: React.FC<RealisticGlobeProps> = ({
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

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    
    console.log("Creating Cesium viewer with ZERO local assets...");
    
    try {
      // Set default access token (this is a public demo token, replace with your own for production)
      // This is needed for Cesium's online services
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTdlZGJlMi00Y2JjLTQyMjEtOGVmOS1hNjE4MTEyZTYwZmQiLCJpZCI6MTQ1MSwiaWF0IjoxNjA4ODkwMjQ0fQ.Wk0FfA5YxB9lGYJtQHY3h-USVWRlEPRYCrmEqbGlaGs';

      // Create a hidden credits element to avoid layout issues
      const credits = document.createElement('div');
      credits.style.display = 'none';

      // Create a basic viewer with NO custom imagery
      // Use Cesium's default Natural Earth II imagery which is built-in to Cesium
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
        // This is a built-in imagery provider that doesn't rely on external files
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        }),
        creditContainer: credits
      });
      
      viewerRef.current = viewer;
      
      // Configure scene for better performance based on performance level
      const scene = viewer.scene;
      
      // Set background color
      scene.backgroundColor = Cesium.Color.BLACK;
      
      // Configure lighting and atmosphere
      const globe = scene.globe;
      globe.enableLighting = true;
      globe.baseColor = Cesium.Color.BLUE;
      
      // Performance settings
      switch(performanceLevel) {
        case 'low':
          if (scene.fog) scene.fog.enabled = false;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
          globe.maximumScreenSpaceError = 4;
          break;
        case 'high':
        case 'ultra':
          if (scene.fog) scene.fog.enabled = true;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
          globe.maximumScreenSpaceError = 1;
          try {
            if (scene.postProcessStages && scene.postProcessStages.fxaa) {
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
          globe.maximumScreenSpaceError = 2;
          break;
      }
      
      // Show celestial bodies if available
      if (scene.sun) scene.sun.show = true;
      if (scene.moon) scene.moon.show = true;
      if (scene.skyBox) scene.skyBox.show = true;
      
      // Set clock to current time for proper day/night effect
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
      
      // Set camera to view the whole Earth initially or fly to coordinates
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates?.lng || -98.5795,
          initialCoordinates?.lat || 39.8283,
          initialCoordinates ? 5000000 : 15000000 // Closer if we have coordinates
        ),
        duration: 0
      });
      
      // Add markers for each group
      groups.forEach(group => {
        if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return;
        
        const lng = group.geo_location.coordinates[0];
        const lat = group.geo_location.coordinates[1];
        const isSelected = selectedGroupId === group.id;
        
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
      
      // Set up smooth rotation animation if enabled
      if (autoRotate && !selectedGroupId) {
        const startRotation = () => {
          if (!viewer || viewer.isDestroyed()) return;
          
          // Set up rotation around Earth's center
          const center = Cesium.Cartesian3.ZERO;
          let lastTime = Date.now();
          const rotationSpeed = 0.05; // degrees per second
          
          const rotate = () => {
            if (!viewer || viewer.isDestroyed()) return;
            
            // Calculate time delta
            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            // Calculate rotation amount
            const rotationAmount = (rotationSpeed * deltaTime) / 1000;
            
            // Create rotation matrix around Y axis (longitude)
            const rotationMatrix = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rotationAmount));
            
            // Get current camera position
            const position = viewer.camera.position;
            const distance = Cesium.Cartesian3.magnitude(position);
            
            // Apply rotation
            const rotatedPosition = new Cesium.Cartesian3();
            Cesium.Matrix3.multiplyByVector(rotationMatrix, position, rotatedPosition);
            
            // Maintain same distance
            const normalizedPos = Cesium.Cartesian3.normalize(rotatedPosition, new Cesium.Cartesian3());
            Cesium.Cartesian3.multiplyByScalar(normalizedPos, distance, rotatedPosition);
            
            // Update camera if valid
            if (!isNaN(rotatedPosition.x) && !isNaN(rotatedPosition.y) && !isNaN(rotatedPosition.z)) {
              viewer.camera.position = rotatedPosition;
              
              // Keep looking at the center
              viewer.camera.lookAt(
                center,
                new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(30), 0)
              );
            }
            
            // Continue animation
            animationRef.current = requestAnimationFrame(rotate);
          };
          
          // Start animation loop
          animationRef.current = requestAnimationFrame(rotate);
        };
        
        // Start rotation after a brief delay
        setTimeout(startRotation, 1000);
      }
      
      console.log("Built-in globe imagery ready");
    } catch (error) {
      console.error("Error creating viewer:", error);
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
        } catch (e) {
          console.error("Error destroying viewer:", e);
        }
      }
    };
  }, [groups, selectedGroupId, initialCoordinates, onGroupSelect, autoRotate, performanceLevel]);

  // Effect to update rotation when autoRotate or selectedGroupId changes
  useEffect(() => {
    // Stop rotation if a group is selected or autoRotate is false
    if (animationRef.current && (!autoRotate || selectedGroupId)) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [autoRotate, selectedGroupId]);

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

export default RealisticGlobePerformance;