'use client';

import { useEffect } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

interface SunLightProps {
  enabled?: boolean;
  useRealDateTime?: boolean;
  customDate?: Date;
  showCityLights?: boolean;
}

/**
 * SunLight component enhances the globe with realistic day/night lighting.
 * It configures the scene to show proper sunlight effects and optionally city lights.
 */
const SunLight: React.FC<SunLightProps> = ({
  enabled = true,
  useRealDateTime = true,
  customDate,
  showCityLights = true
}) => {
  const { viewer, scene } = useCesium();

  useEffect(() => {
    if (!viewer || !scene || !enabled) return;
    
    try {
      // Set light source to the sun
      if (Cesium.SunLight && typeof Cesium.SunLight === 'function') {
        try {
          // Modern Cesium versions
          scene.light = new Cesium.SunLight();
        } catch (e) {
          console.warn('Could not create SunLight, using default lighting:', e);
        }
      }
      
      // Enable globe lighting
      scene.globe.enableLighting = true;
      
      // Set up atmosphere for realism
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
        scene.skyAtmosphere.hueShift = 0.0;
        scene.skyAtmosphere.saturationShift = 0.1;
        scene.skyAtmosphere.brightnessShift = 0.1;
      }
      
      // Ensure scene has proper space background
      scene.backgroundColor = Cesium.Color.BLACK;
      
      // Show the sun
      if (scene.sun) {
        scene.sun.show = true;
      }
      
      // Show stars in the skybox
      if (scene.skyBox) {
        scene.skyBox.show = true;
      }
      
      // Set clock to current time or custom date for proper lighting
      if (useRealDateTime) {
        viewer.clock.currentTime = Cesium.JulianDate.fromDate(
          customDate || new Date()
        );
      }
      
      // Animate the clock to show day/night cycle
      viewer.clock.shouldAnimate = true;
      
      // Configure city lights for nighttime
      if (showCityLights) {
        // Modern Cesium might support nightColorBrightness
        try {
          // Use type assertion to bypass TypeScript checking since 
          // nightColorBrightness may exist at runtime but not in type definitions
          (scene.globe as any).nightColorBrightness = 3.0;
        } catch (e) {
          console.warn('nightColorBrightness not supported:', e);
          // Fallback for older versions - use a custom night imagery provider if possible
        }
      }
      
      // Apply light to terrain for better shadows
      if (scene.globe.terrainProvider && scene.globe.terrainProvider.hasVertexNormals) {
        scene.globe.enableLighting = true;
      }
      
      // Enable shadows if available and supported
      if (viewer.shadowMap && typeof viewer.shadowMap.enabled !== 'undefined') {
        try {
          viewer.shadowMap.enabled = true;
          viewer.shadowMap.softShadows = true;
        } catch (e) {
          console.warn('Error enabling shadows:', e);
        }
      }
    } catch (e) {
      console.error('Error configuring sun lighting:', e);
    }
    
    // No specific cleanup needed as the viewer will handle this
  }, [viewer, scene, enabled, useRealDateTime, customDate, showCityLights]);

  // This component doesn't render anything directly
  return null;
};

export default SunLight;