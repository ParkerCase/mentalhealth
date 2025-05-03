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
}

// Enhanced version with rotation and better visuals
const RealisticGlobePerformance: React.FC<RealisticGlobeProps> = ({
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  autoRotate = true // Default to true for rotation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const animationRef = useRef<number | null>(null);

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
        // Use the offline imagery provider
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        }),
        creditContainer: document.createElement('div')
      });
      
      viewerRef.current = viewer;
      
      // Enable atmosphere and lighting for more realistic appearance
      viewer.scene.globe.enableLighting = true;
      
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
        // Make the atmosphere more visible
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 0.1;
      }
      
      // Show the sun for better lighting
      if (viewer.scene.sun) {
        viewer.scene.sun.show = true;
      }

      // Add stars in the background
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = true;
      }
      
      // Set camera to view the whole Earth initially
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates?.lng || -98.5795,
          initialCoordinates?.lat || 39.8283,
          initialCoordinates ? 5000000 : 15000000 // Closer if we have coordinates
        ),
        duration: 0
      });
      
      // Ensure we can't zoom in too close
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000000; // 1000km
      
      // Add markers for each group
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
      
      // Set up click handler for group selection
      if (onGroupSelect) {
        handlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handlerRef.current.setInputAction((click: any) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id;
            const selectedGroup = groups.find(g => g.id === entity.id);
            if (selectedGroup) {
              // Stop rotation when a group is selected
              onGroupSelect(selectedGroup);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }
      
      // Set up smooth rotation animation
      if (autoRotate && !selectedGroupId) {
        const startRotation = () => {
          if (!viewer || viewer.isDestroyed()) return;
          
          let lastTime = Date.now();
          let spinRate = 0.05; // degrees per second - very slow
          
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
              const cameraDirection = viewer.camera.direction;
              
              // Calculate rotation around Earth's center
              const center = Cesium.Cartesian3.ZERO;
              const transform = Cesium.Matrix4.fromTranslation(center);
              
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
      
      console.log("Enhanced globe ready - should be rotating slowly");
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
  }, [groups, selectedGroupId, initialCoordinates, onGroupSelect, autoRotate]);

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

export default RealisticGlobePerformance;