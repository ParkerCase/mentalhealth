'use client';

import { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

interface CameraControllerProps {
  flyToProps?: {
    destination?: Cesium.Cartesian3 | [number, number, number]; // lat, lng, height
    orientation?: {
      heading?: number;
      pitch?: number;
      roll?: number;
    };
    duration?: number;
  };
  lookAt?: {
    target: Cesium.Cartesian3 | [number, number, number]; // lat, lng, height
    offset?: Cesium.Cartesian3 | [number, number, number]; // heading, pitch, range
  };
  enabled?: boolean;
  mode?: 'flyTo' | 'lookAt' | 'rotate';
  rotateOptions?: {
    speed?: number; // degrees per second
    altitude?: number; // meters
  };
}

/**
 * Controller for programmatic camera movement
 */
const CameraController: React.FC<CameraControllerProps> = ({
  flyToProps,
  lookAt,
  enabled = true,
  mode = 'flyTo',
  rotateOptions = {
    speed: 0.05,
    altitude: 10000000
  }
}) => {
  const { viewer, camera } = useCesium();
  const rotationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!viewer || !camera || !enabled) return;

    // Handle different camera modes
    if (mode === 'flyTo' && flyToProps) {
      const destination = 
        Array.isArray(flyToProps.destination) 
          ? Cesium.Cartesian3.fromDegrees(
              flyToProps.destination[1], // lng
              flyToProps.destination[0], // lat
              flyToProps.destination[2]  // height
            )
          : flyToProps.destination;

      if (destination) {
        camera.flyTo({
          destination,
          orientation: flyToProps.orientation,
          duration: flyToProps.duration || 2
        });
      }
    } 
    else if (mode === 'lookAt' && lookAt) {
      const target = 
        Array.isArray(lookAt.target) 
          ? Cesium.Cartesian3.fromDegrees(
              lookAt.target[1], // lng
              lookAt.target[0], // lat
              lookAt.target[2]  // height
            )
          : lookAt.target;

      const offset = 
        Array.isArray(lookAt.offset) 
          ? new Cesium.HeadingPitchRange(
              Cesium.Math.toRadians(lookAt.offset[0]),
              Cesium.Math.toRadians(lookAt.offset[1]),
              lookAt.offset[2]
            )
          : undefined;

      if (target) {
        camera.lookAt(target, offset);
      }
    }
    else if (mode === 'rotate') {
      // Start rotation animation
      const startRotation = () => {
        if (!viewer || !camera) return;
        
        // Get current position
        const center = Cesium.Cartesian3.fromDegrees(0, 0);
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        
        // Set up rotation
        let heading = camera.heading;
        
        rotationRef.current = requestAnimationFrame(function rotate() {
          // Only proceed if viewer and camera still exist
          if (!viewer || !camera) return;
          
          // Update heading for rotation
          heading += Cesium.Math.toRadians(rotateOptions.speed || 0.05);
          
          // Position camera
          const position = new Cesium.Cartesian3(
            (rotateOptions.altitude || 10000000) * Math.cos(heading),
            (rotateOptions.altitude || 10000000) * Math.sin(heading),
            2000000 // Height above the equator
          );
          
          // Transform to proper coordinate system
          const cameraPosition = Cesium.Matrix4.multiplyByPoint(
            transform,
            position,
            new Cesium.Cartesian3()
          );
          
          // Update camera
          camera.setView({
            destination: cameraPosition,
            orientation: {
              heading: heading + Math.PI,
              pitch: -Cesium.Math.toRadians(30),
              roll: 0
            }
          });
          
          // Continue animation
          rotationRef.current = requestAnimationFrame(rotate);
        });
      };
      
      startRotation();
    }

    // Cleanup
    return () => {
      if (rotationRef.current !== null) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [viewer, camera, flyToProps, lookAt, enabled, mode, rotateOptions]);

  // This component doesn't render anything
  return null;
};

export default CameraController;