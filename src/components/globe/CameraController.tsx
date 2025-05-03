'use client';

import { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

interface FlyToProps {
  destination?: Cesium.Cartesian3 | [number, number, number]; // [lng, lat, height]
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
  duration?: number;
}

interface RotateOptions {
  speed?: number; // degrees per second
  altitude?: number; // meters
  tiltAngle?: number; // in degrees
}

interface CameraControllerProps {
  flyToProps?: FlyToProps;
  mode?: 'flyTo' | 'rotate' | 'none';
  enabled?: boolean;
  rotateOptions?: RotateOptions;
}

/**
 * CameraController - Controls camera movement and rotation
 * 
 * Provides three modes:
 * - flyTo: Flies to a specified destination
 * - rotate: Continuously rotates around the Earth
 * - none: No automatic camera movement
 */
const CameraController: React.FC<CameraControllerProps> = ({
  flyToProps,
  enabled = true,
  mode = 'none',
  rotateOptions = {
    speed: 0.05,
    altitude: 15000000,
    tiltAngle: 30
  }
}) => {
  const { viewer, camera } = useCesium();
  const rotationRef = useRef<number | null>(null);

  // Handle component cleanup
  useEffect(() => {
    return () => {
      if (rotationRef.current !== null) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, []);

  // Handle fly-to mode
  useEffect(() => {
    if (!viewer || !camera || !enabled || mode !== 'flyTo' || !flyToProps) return;

    try {
      const { destination, orientation, duration } = flyToProps;
      
      // Convert destination from array to Cartesian3 if needed
      let finalDestination: Cesium.Cartesian3;
      if (Array.isArray(destination)) {
        finalDestination = Cesium.Cartesian3.fromDegrees(
          destination[0], // longitude
          destination[1], // latitude
          destination[2]  // height
        );
      } else if (destination) {
        finalDestination = destination;
      } else {
        // Default destination if none specified
        finalDestination = Cesium.Cartesian3.fromDegrees(0, 0, 15000000);
      }
      
      // Set up orientation - create proper HeadingPitchRoll instance
      const finalOrientation: Cesium.HeadingPitchRoll | undefined = orientation ? 
        new Cesium.HeadingPitchRoll(
          Cesium.Math.toRadians(orientation.heading || 0),
          Cesium.Math.toRadians(orientation.pitch || -30),
          Cesium.Math.toRadians(orientation.roll || 0)
        ) : undefined;
      
      // Execute the flyTo
      camera.flyTo({
        destination: finalDestination,
        orientation: finalOrientation,
        duration: duration || 2,
        complete: () => {
          // Optional callback when flight is complete
          console.log('Camera flight completed');
        },
        cancel: () => {
          // Optional callback when flight is cancelled
          console.log('Camera flight cancelled');
        }
      });
    } catch (error) {
      console.error('Error in camera flyTo:', error);
    }
  }, [viewer, camera, enabled, mode, flyToProps]);

  // Handle auto-rotation mode
  useEffect(() => {
    if (!viewer || !camera || !enabled || mode !== 'rotate') return;

    // Cancel any existing rotation
    if (rotationRef.current !== null) {
      cancelAnimationFrame(rotationRef.current);
      rotationRef.current = null;
    }

    try {
      // Set up the Earth center as our rotation point
      const center = Cesium.Cartesian3.fromDegrees(0, 0);
      const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
      
      // Get current heading or start fresh
      let heading = camera.heading;
      
      // Start rotation animation loop
      const rotate = () => {
        if (!viewer || !camera) return;
        
        // Increment heading for smooth rotation
        heading += Cesium.Math.toRadians(rotateOptions.speed || 0.05);
        
        // Calculate new camera position in orbit
        const position = new Cesium.Cartesian3(
          (rotateOptions.altitude || 15000000) * Math.cos(heading),
          (rotateOptions.altitude || 15000000) * Math.sin(heading),
          (rotateOptions.altitude || 15000000) * 0.3 // Slight altitude to show tilt
        );
        
        // Transform to proper coordinate system
        const cameraPosition = Cesium.Matrix4.multiplyByPoint(
          transform,
          position,
          new Cesium.Cartesian3()
        );
        
        // Update camera with proper orientation
        camera.setView({
          destination: cameraPosition,
          orientation: {
            heading: heading + Math.PI, // Look toward center
            pitch: Cesium.Math.toRadians(-(rotateOptions.tiltAngle || 30)),
            roll: 0
          }
        });
        
        // Continue animation loop
        rotationRef.current = requestAnimationFrame(rotate);
      };
      
      // Start the animation
      rotationRef.current = requestAnimationFrame(rotate);
    } catch (error) {
      console.error('Error setting up camera rotation:', error);
    }
    
    // Cleanup on mode change or component unmount
    return () => {
      if (rotationRef.current !== null) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [viewer, camera, enabled, mode, rotateOptions]);

  // This component doesn't render anything directly
  return null;
};

export default CameraController;