'use client';

import { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

interface CameraControllerProps {
  enabled?: boolean;
  mode?: 'rotate';
  rotateOptions?: {
    speed?: number; // degrees per second
    altitude?: number; // meters
  };
}

const CameraController: React.FC<CameraControllerProps> = ({
  enabled = true,
  mode = 'rotate',
  rotateOptions = {
    speed: 0.02,
    altitude: 15000000,
  },
}) => {
  const { viewer, camera } = useCesium();
  const rotationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!viewer || !camera || !enabled || mode !== 'rotate') return;

    const center = Cesium.Cartesian3.fromDegrees(0, 0);
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    let heading = camera.heading;

    const rotate = () => {
      if (!viewer || !camera) return;
      heading += Cesium.Math.toRadians(rotateOptions.speed || 0.02);

      const position = new Cesium.Cartesian3(
        (rotateOptions.altitude || 15000000) * Math.cos(heading),
        (rotateOptions.altitude || 15000000) * Math.sin(heading),
        2000000
      );

      const cameraPosition = Cesium.Matrix4.multiplyByPoint(
        transform,
        position,
        new Cesium.Cartesian3()
      );

      camera.setView({
        destination: cameraPosition,
        orientation: {
          heading: heading + Math.PI,
          pitch: -Cesium.Math.toRadians(30),
          roll: 0,
        },
      });

      rotationRef.current = requestAnimationFrame(rotate);
    };

    rotationRef.current = requestAnimationFrame(rotate);

    return () => {
      if (rotationRef.current !== null) {
        cancelAnimationFrame(rotationRef.current);
        rotationRef.current = null;
      }
    };
  }, [viewer, camera, enabled, mode, rotateOptions]);

  return null;
};

export default CameraController;
