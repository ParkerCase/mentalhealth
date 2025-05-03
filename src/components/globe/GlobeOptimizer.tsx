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
 * Helper to create terrain provider with proper fallbacks
 */
function createCompatibleTerrainProvider(): Cesium.TerrainProvider {
  try {
    if ((Cesium.Ion as any)?.createWorldTerrain) {
      return (Cesium.Ion as any).createWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: true
      });
    }

    if (Cesium.CesiumTerrainProvider) {
      return new Cesium.CesiumTerrainProvider({
        url: 'https://assets.agi.com/stk-terrain/world'
      } as any);
    }
  } catch (e) {
    console.warn('Falling back to flat terrain:', e);
  }

  return new Cesium.EllipsoidTerrainProvider(); // ✅ safest fallback
}


/**
 * Helper to safely handle both Promise and direct return for terrain providers
 */
function isPromiseLike<T>(obj: any): obj is Promise<T> {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

/**
 * Optimizes the Globe component for different performance targets
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

  // Helper function to handle terrain provider creation safely
  const createAndSetTerrainProvider = (options: { 
    requestVertexNormals?: boolean, 
    requestWaterMask?: boolean 
  } = {}) => {
    if (!viewer || viewer.isDestroyed()) return;
    
    try {
      // Try to create the terrain provider
// Don't override if fallback terrain is already set
if (
  viewer?.terrainProvider instanceof Cesium.EllipsoidTerrainProvider &&
  performanceLevel === 'medium'
) {
  console.warn("Preserving safe EllipsoidTerrainProvider — skipping terrain override.");
  return;
}

// Otherwise proceed with terrain override
let terrainProvider = createCompatibleTerrainProvider();
      
      // Handle both Promise-based and direct return scenarios
      if (isPromiseLike<Cesium.TerrainProvider>(terrainProvider)) {
        // Using Promise.resolve to safely handle the promise
        Promise.resolve(terrainProvider)
          .then((resolvedProvider: Cesium.TerrainProvider) => {
            if (viewer && !viewer.isDestroyed()) {
              viewer.terrainProvider = resolvedProvider;
            }
          })
          .catch((error: any) => {
            console.warn('Failed to load terrain provider:', error);
            
          });
      } else {
        // Direct assignment for non-Promise return value
        if (!viewer.isDestroyed()) {
          viewer.terrainProvider = terrainProvider;
        }
      }
    } catch (e) {
      console.warn('Failed to set terrain provider:', e);
    }
  };

  useEffect(() => {
    if (!viewer || !scene) return;

    // Configure the viewer based on performance level
    const configurePerformance = () => {
      if (!viewer || !scene || viewer.isDestroyed() || scene.isDestroyed()) return;
      
      // Apply core settings that are safe across versions
      try {
        // Set fog settings
        if (scene.fog) {
          scene.fog.enabled = globalFogDensity > 0;
          scene.fog.density = globalFogDensity * 0.0001; // Scale for Cesium's units
        }
        
        // Try to set target frame rate if supported
        (viewer as any).targetFrameRate = targetFrameRate;
        
        // Try to enable request render mode if supported
        (viewer as any).requestRenderMode = true;
      } catch (e) {
        console.warn('Could not set some Cesium performance options:', e);
      }
      
      // Apply performance level presets
      switch (performanceLevel) {
        case 'low':
          if (scene.fog) scene.fog.enabled = false;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
          scene.globe.enableLighting = false;
      
          try {
            (scene as any).sun = undefined;
            (scene as any).moon = undefined;
            if (scene.skyBox) scene.skyBox.show = false;
            (scene as any).fxaa = false;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = false;
            }
          } catch (e) {
            console.warn('Some scene elements not available:', e);
          }
      
          scene.globe.maximumScreenSpaceError = 4;
      
          break; // ✅ Prevents unintentional fall-through to 'medium'
      
        case 'medium':
          if (scene.fog) scene.fog.enabled = true;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
          scene.globe.enableLighting = dynamicLighting;
          scene.globe.maximumScreenSpaceError = 2;
      
          try {
            (scene as any).fxaa = true;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = true;
            }
          } catch (e) {
            console.warn('Could not set fxaa:', e);
          }
      
          if (dynamicTerrain) {
            createAndSetTerrainProvider({ 
              requestVertexNormals: false, 
              requestWaterMask: false 
            });
          }
      
          break; // ✅ Critical!
          
        case 'high':
          // High quality with good performance
          if (scene.fog) scene.fog.enabled = true;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
          scene.globe.enableLighting = true;
          scene.globe.maximumScreenSpaceError = 1.5;
          
          // Enable anti-aliasing
          try {
            (scene as any).fxaa = true;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = true;
            }
          } catch (e) {
            console.warn('Could not set fxaa:', e);
          }
          
          // Enable shadows if available
          try {
            if (viewer.shadowMap) {
              viewer.shadowMap.enabled = true;
              viewer.shadowMap.softShadows = false;
            }
          } catch (e) {
            console.warn('Could not configure shadows:', e);
          }
          
          // Use terrain with high detail
          createAndSetTerrainProvider({ 
            requestVertexNormals: true,
            requestWaterMask: false
          });
          break;
          
        case 'ultra':
          // Maximum quality
          if (scene.fog) scene.fog.enabled = true;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
          scene.globe.enableLighting = true;
          scene.globe.maximumScreenSpaceError = 1;
          
          // Enable anti-aliasing
          try {
            (scene as any).fxaa = true;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = true;
            }
          } catch (e) {
            console.warn('Could not set fxaa:', e);
          }
          
          // Enable shadows if available
          try {
            if (viewer.shadowMap) {
              viewer.shadowMap.enabled = true;
              viewer.shadowMap.softShadows = true;
            }
          } catch (e) {
            console.warn('Could not configure shadows:', e);
          }
          
          // Use terrain with maximum detail
          createAndSetTerrainProvider({ 
            requestVertexNormals: true,
            requestWaterMask: true
          });
          break;
      }
      
      // Try to configure frustum culling if available
      try {
        (scene as any).cullWithChildrenBounds = useFrustumCulling;
      } catch (e) {
        console.warn('cullWithChildrenBounds not available:', e);
      }
      
      // Force a render to apply changes
      scene.requestRender();
    };
    
    // Apply the configuration
    configurePerformance();
    
    // Simple performance monitor (without adjustments)
    let frameCount = 0;
    let lastTime = performance.now();
    
    const performanceMonitor = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      
      // Measure FPS every second
      if (delta >= 1000) {
        const fps = frameCount * 1000 / delta;
        console.debug(`Current FPS: ${fps.toFixed(1)}`);
        
        // Reset counters
        frameCount = 0;
        lastTime = now;
      }
    };
    
    // Try to add pre-render event for monitoring
    try {
      scene.preRender.addEventListener(performanceMonitor);
    } catch (e) {
      console.warn('Could not add performance monitor:', e);
    }
    
    // Cleanup
    return () => {
      try {
        if (scene && !scene.isDestroyed()) {
          scene.preRender.removeEventListener(performanceMonitor);
        }
      } catch (e) {
        console.warn('Could not remove performance monitor:', e);
      }
    };
  }, [viewer, scene, performanceLevel, targetFrameRate, useFrustumCulling, dynamicLighting, dynamicTerrain, globalFogDensity]);

  // This component doesn't render anything directly
  return null;
};

export default GlobeOptimizer;