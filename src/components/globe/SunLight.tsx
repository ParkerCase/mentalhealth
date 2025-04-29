'use client';

import { useEffect } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

/**
 * SunLight component enhances the globe with realistic sun lighting
 * and ensures proper day/night cycles
 */
const SunLight: React.FC = () => {
  const { viewer, scene } = useCesium();

  useEffect(() => {
    if (!viewer || !scene) return;

    // Set the scene's light to use the sun as the light source
    if (Cesium.SunLight) {
      scene.light = new Cesium.SunLight();
    }
    
    // Make sure lighting is enabled on the globe
    scene.globe.enableLighting = true;

    // Set up atmosphere for more realistic visuals
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.hueShift = 0.0;
      scene.skyAtmosphere.saturationShift = 0.1;
      scene.skyAtmosphere.brightnessShift = 0.1;
    }

    // Ensure the scene has the proper space background
    scene.backgroundColor = Cesium.Color.BLACK;

    // Show the sun in the scene
    if (scene.sun) {
      scene.sun.show = true;
    }

    // Show stars in the skybox
    if (scene.skyBox) {
      scene.skyBox.show = true;
    }

    // Improve rendering quality with anti-aliasing
    if (scene.postProcessStages?.fxaa) {
      scene.postProcessStages.fxaa.enabled = true;
    }

    // Set the clock to current time for proper sun positioning
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    
    // Set the clock to use the current time and continue advancing
    viewer.clock.shouldAnimate = true;
    
    // Configure shadow maps for better visuals if available
    if (viewer.shadowMap) {
      viewer.shadowMap.enabled = true;
      viewer.shadowMap.softShadows = true;
    }
    
    // Return cleanup function
    return () => {
      // No specific cleanup needed as viewer will handle this
    };
  }, [viewer, scene]);

  // This component doesn't render anything directly
  return null;
};

export default SunLight;