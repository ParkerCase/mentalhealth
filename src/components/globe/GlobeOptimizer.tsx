'use client';

import { useEffect } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

type PerformanceLevel = 'low' | 'medium' | 'high' | 'ultra';

interface GlobeOptimizerProps {
  performanceLevel?: PerformanceLevel;
  targetFrameRate?: number;
  useFrustumCulling?: boolean;
  dynamicLighting?: boolean;
  dynamicTerrain?: boolean;
  globalFogDensity?: number; // 0 to 1
}

/**
 * GlobeOptimizer - Configures performance settings for the Cesium globe
 */
const GlobeOptimizer: React.FC<GlobeOptimizerProps> = ({
  performanceLevel = 'medium',
  targetFrameRate = 30,
  useFrustumCulling = true,
  dynamicLighting = true,
  dynamicTerrain = true,
  globalFogDensity = 0
}) => {
  const { viewer, scene } = useCesium();

  // Helper function to safely create EllipsoidTerrainProvider
  const createSafeTerrainProvider = () => {
    try {
      return new Cesium.EllipsoidTerrainProvider();
    } catch (e) {
      console.warn('Error creating EllipsoidTerrainProvider:', e);
      return null;
    }
  };

  useEffect(() => {
    if (!viewer || !scene || viewer.isDestroyed() || scene.isDestroyed()) return;

    // Apply basic performance settings
    try {
      // Configure fog
      if (scene.fog) {
        scene.fog.enabled = globalFogDensity > 0;
        scene.fog.density = globalFogDensity * 0.0001;
      }
      
      // Set frame rate
      (viewer as any).targetFrameRate = targetFrameRate;
      
      // Request render mode for better performance
      (viewer as any).requestRenderMode = true;
      (viewer as any).maximumRenderTimeChange = Infinity;
    } catch (e) {
      console.warn('Error applying basic performance settings:', e);
    }

    // Configure based on performance level
    switch (performanceLevel) {
      case 'low':
        // Disable expensive effects
        if (scene.fog) scene.fog.enabled = false;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
        scene.globe.enableLighting = false;
        
        // Disable sun, moon, and stars
        try {
          if (scene.sun) scene.sun.show = false;
          if (scene.moon) scene.moon.show = false;
          if (scene.skyBox) scene.skyBox.show = false;
        } catch (e) {
          console.warn('Error disabling celestial bodies:', e);
        }
        
        // Disable anti-aliasing
        try {
          if (scene.postProcessStages?.fxaa) {
            scene.postProcessStages.fxaa.enabled = false;
          }
        } catch (e) {
          console.warn('Error disabling FXAA:', e);
        }
        
        // Lower terrain resolution
        scene.globe.maximumScreenSpaceError = 4;
        break;
        
      case 'medium':
        // Balanced settings
        if (scene.fog) scene.fog.enabled = true;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
        scene.globe.enableLighting = dynamicLighting;
        scene.globe.maximumScreenSpaceError = 2;
        
        // Enable basic anti-aliasing
        try {
          if (scene.postProcessStages?.fxaa) {
            scene.postProcessStages.fxaa.enabled = true;
          }
        } catch (e) {
          console.warn('Error enabling FXAA:', e);
        }
        
        // Keep the default EllipsoidTerrainProvider for better performance
        break;
        
      case 'high':
        // High quality
        if (scene.fog) scene.fog.enabled = true;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
        scene.globe.enableLighting = true;
        scene.globe.maximumScreenSpaceError = 1.5;
        
        // Enable anti-aliasing
        try {
          if (scene.postProcessStages?.fxaa) {
            scene.postProcessStages.fxaa.enabled = true;
          }
        } catch (e) {
          console.warn('Error enabling FXAA:', e);
        }
        
        // Enable shadows
        try {
          if (viewer.shadowMap) {
            viewer.shadowMap.enabled = true;
            viewer.shadowMap.softShadows = false;
          }
        } catch (e) {
          console.warn('Error enabling shadows:', e);
        }
        
        // Try to use CesiumTerrainProvider if available
        if (dynamicTerrain && Cesium.CesiumTerrainProvider) {
          try {
            // Keep using EllipsoidTerrainProvider for now to avoid token issues
            // We would normally use CesiumTerrainProvider here
          } catch (e) {
            console.warn('Error creating terrain provider:', e);
          }
        }
        break;
        
      case 'ultra':
        // Maximum quality
        if (scene.fog) scene.fog.enabled = true;
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
        scene.globe.enableLighting = true;
        scene.globe.maximumScreenSpaceError = 1;
        
        // Enable anti-aliasing
        try {
          if (scene.postProcessStages?.fxaa) {
            scene.postProcessStages.fxaa.enabled = true;
          }
        } catch (e) {
          console.warn('Error enabling FXAA:', e);
        }
        
        // Enable shadows with soft shadows
        try {
          if (viewer.shadowMap) {
            viewer.shadowMap.enabled = true;
            viewer.shadowMap.softShadows = true;
          }
        } catch (e) {
          console.warn('Error enabling soft shadows:', e);
        }
        
        // Try to use CesiumTerrainProvider with vertex normals
        if (dynamicTerrain && Cesium.CesiumTerrainProvider) {
          try {
            // Keep using EllipsoidTerrainProvider for now to avoid token issues
            // We would normally use CesiumTerrainProvider with vertex normals here
          } catch (e) {
            console.warn('Error creating terrain provider with vertex normals:', e);
          }
        }
        break;
    }
    
    // Try to configure frustum culling if available
    try {
      (scene as any).cullWithChildrenBounds = useFrustumCulling;
    } catch (e) {
      console.warn('Error setting cullWithChildrenBounds:', e);
    }
    
    // Force a render to apply changes
    scene.requestRender();
    
    // Frame counter for performance monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const performanceMonitor = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      
      // Log FPS every second
      if (delta >= 1000) {
        const fps = frameCount * 1000 / delta;
        
        // Only log in development or when debug is needed
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Globe FPS: ${fps.toFixed(1)}`);
        }
        
        // Reset counters
        frameCount = 0;
        lastTime = now;
      }
    };
    
    // Add performance monitor
    let removePerformanceMonitor: (() => void) | undefined;
    try {
      const preRenderEvent = scene.preRender;
      if (preRenderEvent && typeof preRenderEvent.addEventListener === 'function') {
        preRenderEvent.addEventListener(performanceMonitor);
        removePerformanceMonitor = () => preRenderEvent.removeEventListener(performanceMonitor);
      }
    } catch (e) {
      console.warn('Error adding performance monitor:', e);
    }
    
    // Return cleanup function
    return () => {
      if (removePerformanceMonitor) {
        try {
          removePerformanceMonitor();
        } catch (e) {
          console.warn('Error removing performance monitor:', e);
        }
      }
    };
  }, [viewer, scene, performanceLevel, targetFrameRate, useFrustumCulling, dynamicLighting, dynamicTerrain, globalFogDensity]);

  // No direct rendering
  return null;
};

export default GlobeOptimizer;