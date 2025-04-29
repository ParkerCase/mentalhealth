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

  useEffect(() => {
    if (!viewer || !scene) return;

    // Configure the viewer based on performance level
    const configurePerformance = () => {
      if (!viewer || !scene) return;
      
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
          // Low quality for better performance
          if (scene.fog) scene.fog.enabled = false;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
          scene.globe.enableLighting = false;
          
          // Try to disable sun/moon/stars
          try {
            // These might not be available in all versions
            (scene as any).sun = undefined;
            (scene as any).moon = undefined;
            if (scene.skyBox) scene.skyBox.show = false;
            
            // Disable anti-aliasing
            (scene as any).fxaa = false;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = false;
            }
          } catch (e) {
            console.warn('Some scene elements not available:', e);
          }
          
          // Lower terrain quality
          scene.globe.maximumScreenSpaceError = 4;
          
          // Use simple terrain
          try {
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
          } catch (e) {
            console.warn('Could not set terrain provider:', e);
          }
          break;
          
        case 'medium':
          // Balanced quality and performance
          if (scene.fog) scene.fog.enabled = true;
          if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
          scene.globe.enableLighting = dynamicLighting;
          scene.globe.maximumScreenSpaceError = 2;
          
          // Enable anti-aliasing if available
          try {
            (scene as any).fxaa = true;
            if (scene.postProcessStages?.fxaa) {
              scene.postProcessStages.fxaa.enabled = true;
            }
          } catch (e) {
            console.warn('Could not set fxaa:', e);
          }
          
          // Use terrain with moderate detail if available
          if (dynamicTerrain) {
            try {
              const createWorldTerrainPromise = Cesium.createWorldTerrain({
                requestVertexNormals: false,
                requestWaterMask: false
              });
              
              // Handle both Promise and direct return cases
              if (createWorldTerrainPromise.then) {
                createWorldTerrainPromise.then((terrain: any) => {
                  if (viewer) {
                    viewer.terrainProvider = terrain;
                  }
                }).catch((error: any) => {
                  console.warn('Failed to load world terrain:', error);
                });
              } else {
                // Handle as direct return (older Cesium versions)
                viewer.terrainProvider = createWorldTerrainPromise;
              }
            } catch (e) {
              console.warn('Could not create world terrain:', e);
            }
          }
          break;
          
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
          try {
            const createWorldTerrainPromise = Cesium.createWorldTerrain({
              requestVertexNormals: true,
              requestWaterMask: false
            });
            
            // Handle both Promise and direct return cases
            if (createWorldTerrainPromise.then) {
              createWorldTerrainPromise.then((terrain: any) => {
                if (viewer) {
                  viewer.terrainProvider = terrain;
                }
              }).catch((error: any) => {
                console.warn('Failed to load world terrain:', error);
              });
            } else {
              // Handle as direct return (older Cesium versions)
              viewer.terrainProvider = createWorldTerrainPromise;
            }
          } catch (e) {
            console.warn('Could not create world terrain:', e);
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
          try {
            const createWorldTerrainPromise = Cesium.createWorldTerrain({
              requestVertexNormals: true,
              requestWaterMask: true
            });
            
            // Handle both Promise and direct return cases
            if (createWorldTerrainPromise.then) {
              createWorldTerrainPromise.then((terrain: any) => {
                if (viewer) {
                  viewer.terrainProvider = terrain;
                }
              }).catch((error: any) => {
                console.warn('Failed to load world terrain:', error);
              });
            } else {
              // Handle as direct return (older Cesium versions)
              viewer.terrainProvider = createWorldTerrainPromise;
            }
          } catch (e) {
            console.warn('Could not create world terrain:', e);
          }
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
        if (scene) {
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