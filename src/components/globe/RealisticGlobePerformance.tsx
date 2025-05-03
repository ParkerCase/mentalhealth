'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Viewer, Entity, ImageryLayer, Globe } from 'resium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Simple interfaces to reduce type complexity
interface BasicGroup {
  id: string;
  name: string;
  geo_location?: {
    coordinates: number[];
  };
  city?: string;
  state?: string;
}

interface RealisticGlobeProps {
  height?: string;
  width?: string;
  groups?: BasicGroup[];
  selectedGroupId?: string;
  onGroupSelect?: (group: BasicGroup) => void;
  initialCoordinates?: { lat: number; lng: number };
  autoRotate?: boolean;
}

/**
 * Lightweight Cesium globe component optimized for performance
 */
const RealisticGlobePerformance: React.FC<RealisticGlobeProps> = ({
  height = '100vh',
  width = '100%',
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates,
  autoRotate = false
}) => {
  const [imageryReady, setImageryReady] = useState(false);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const rotationRef = useRef<number | null>(null);
  const creditContainer = useRef<HTMLDivElement>(document.createElement('div'));
  
  // Initialize the viewer
  const handleViewerMounted = useCallback((viewer: Cesium.Viewer) => {
    if (!viewer) return;
    
    viewerRef.current = viewer;
    const scene = viewer.scene;
    const globe = scene.globe;
    
    // Critical performance settings
    globe.show = true;
    globe.baseColor = Cesium.Color.DARKBLUE; // This helps users see something while waiting
    
    // ⚠️ PERFORMANCE: Disable high-cost features
    scene.fog.enabled = false;
    scene.skyAtmosphere.show = false;
    globe.enableLighting = false;
    
    // Hide sun and moon - use type-safe approach with optional chaining
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    if (scene.skyBox) scene.skyBox.show = false;
    
    scene.backgroundColor = Cesium.Color.BLACK;
    
    // ⚠️ PERFORMANCE: Reduce quality for faster loading
    globe.maximumScreenSpaceError = 4; // Higher value = less detail = better performance
    
    // ⚠️ PERFORMANCE: Reduce memory usage
    (scene as any).globe.tileCacheSize = 50; // Default is 100
    
    // ⚠️ PERFORMANCE: Cesium creates hidden elements fast
    (viewer as any).requestRenderMode = true;
    (viewer as any).maximumRenderTimeChange = Infinity;
    
    // Improve load speed by using 2D mode initially
    if (scene.mode !== Cesium.SceneMode.SCENE2D) {
      try {
        scene.mode = Cesium.SceneMode.SCENE2D;
        // Schedule transition to 3D after initial load
        setTimeout(() => {
          try {
            scene.mode = Cesium.SceneMode.SCENE3D;
          } catch (e) {
            console.warn('Could not switch to 3D mode:', e);
          }
        }, 2000);
      } catch (e) {
        console.warn('Could not set scene mode:', e);
      }
    }
    
    // Set camera to initial position with very high altitude
    if (initialCoordinates) {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          initialCoordinates.lng,
          initialCoordinates.lat,
          20000000 // Start very far out
        )
      });
    }
    
    // Configure camera limits to prevent zooming in too much (saves memory)
    scene.screenSpaceCameraController.minimumZoomDistance = 100000; // 100km min altitude
    
    // Force immediate render
    scene.requestRender();
    setImageryReady(true);
    
    console.log("✅ Viewer configured for optimal performance");
  }, [initialCoordinates]);
  
  // Configure auto-rotation
  useEffect(() => {
    if (!viewerRef.current || !autoRotate) return;
    
    // Cancel any existing rotation
    if (rotationRef.current) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }
    
    // Setup rotation at high altitude to minimize tile loading
    const viewer = viewerRef.current;
    const camera = viewer.camera;
    
    const startRotation = () => {
      if (!viewer || viewer.isDestroyed() || !camera) return;
      
      // Get current heading or start at 0
      let heading = camera.heading || 0;
      
      // Simple rotation loop
      const rotate = () => {
        if (!viewer || viewer.isDestroyed() || !camera) return;
        
        // Increment heading slowly (less frequent updates = better performance)
        heading += Cesium.Math.toRadians(0.1);
        
        // Position camera at high altitude to reduce tile loads
        const center = Cesium.Cartesian3.fromDegrees(0, 0);
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        
        const position = new Cesium.Cartesian3(
          15000000 * Math.cos(heading),
          15000000 * Math.sin(heading),
          5000000
        );
        
        const cameraPosition = Cesium.Matrix4.multiplyByPoint(
          transform,
          position,
          new Cesium.Cartesian3()
        );
        
        // Update camera with tilt
        camera.setView({
          destination: cameraPosition,
          orientation: {
            heading: heading + Math.PI,
            pitch: Cesium.Math.toRadians(-30),
            roll: 0
          }
        });
        
        // Continue animation with throttled framerate (lower is better for performance)
        setTimeout(() => {
          rotationRef.current = requestAnimationFrame(rotate);
        }, 100); // Only update camera position 10 times per second
      };
      
      // Start rotation
      rotationRef.current = requestAnimationFrame(rotate);
    };
    
    // Start rotation after a delay to let initial load complete
    const rotationTimer = setTimeout(() => {
      startRotation();
    }, 2000);
    
    // Cleanup function
    return () => {
      clearTimeout(rotationTimer);
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [autoRotate]);
  
  // Cleanup on unmount
  useEffect(() => {
    // Create a stable credit container
    creditContainer.current.style.display = 'none';
    document.body.appendChild(creditContainer.current);
    
    // Ensure proper cleanup
    return () => {
      if (rotationRef.current) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
      
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          // Destroy viewer to free memory
          viewerRef.current.destroy();
          viewerRef.current = null;
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
      }
      
      // Remove credit container
      if (creditContainer.current.parentNode) {
        creditContainer.current.parentNode.removeChild(creditContainer.current);
      }
      
      // Force garbage collection if possible
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          // Not all browsers support this
        }
      }
    };
  }, []);
  
  // Simplified entity rendering
  const renderGroupMarkers = () => {
    // Only render a maximum of 50 markers to prevent performance issues
    return groups.slice(0, 50).map((group) => {
      if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return null;
      
      const lng = group.geo_location.coordinates[0];
      const lat = group.geo_location.coordinates[1];
      const isSelected = selectedGroupId === group.id;
      
      return (
        <Entity
          key={group.id}
          position={Cesium.Cartesian3.fromDegrees(lng, lat)}
          point={{
            pixelSize: isSelected ? 12 : 8,
            color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }}
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
  
  return (
    <div style={{ height, width, position: 'relative' }}>
      {/* Loading overlay */}
      {!imageryReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#292929',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div>Loading Globe... Please wait.</div>
        </div>
      )}
      
      {/* Simplified Cesium Viewer */}
      <Viewer
        full
        ref={(ref: any) => {
          if (ref?.cesiumElement) {
            handleViewerMounted(ref.cesiumElement);
          }
        }}
        // Disable all extra widgets for better performance
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
        creditContainer={creditContainer.current}
        terrainProvider={new Cesium.EllipsoidTerrainProvider()}
        imageryProvider={new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/'
        })}
      >
        {/* Add minimal globe configuration */}
        <Globe 
          enableLighting={false}
          depthTestAgainstTerrain={false}
        />
        
        {/* Only render markers if fully loaded */}
        {imageryReady && renderGroupMarkers()}
      </Viewer>
    </div>
  );
};

export default RealisticGlobePerformance;