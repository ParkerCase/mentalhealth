import * as Cesium from 'cesium';

/**
 * Utility functions for the Globe component
 */

/**
 * Creates flight paths between two points with a curved trajectory
 * @param startLat - Starting latitude
 * @param startLng - Starting longitude
 * @param endLat - Ending latitude
 * @param endLng - Ending longitude 
 * @param maxHeight - Maximum height of the curve in meters
 * @param steps - Number of points in the curve
 * @returns Array of Cartesian3 positions for the curve
 */
export function createCurvedPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  maxHeight: number = 300000,
  steps: number = 50
): Cesium.Cartesian3[] {
  const points: Cesium.Cartesian3[] = [];
  
  // Convert to radians
  const startLatRad = Cesium.Math.toRadians(startLat);
  const startLngRad = Cesium.Math.toRadians(startLng);
  const endLatRad = Cesium.Math.toRadians(endLat);
  const endLngRad = Cesium.Math.toRadians(endLng);
  
  // Calculate the great circle distance
  const distance = Cesium.Cartesian3.distance(
    Cesium.Cartesian3.fromRadians(startLngRad, startLatRad),
    Cesium.Cartesian3.fromRadians(endLngRad, endLatRad)
  );
  
  // Adjust max height based on distance for more natural looks
  const adjustedMaxHeight = Math.min(maxHeight, distance * 0.3);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    // Interpolate position
    const lng = startLng + (endLng - startLng) * t;
    const lat = startLat + (endLat - startLat) * t;
    
    // Add height following a sin curve (0 at endpoints, max at middle)
    const height = adjustedMaxHeight * Math.sin(Math.PI * t);
    
    points.push(Cesium.Cartesian3.fromDegrees(lng, lat, height));
  }
  
  return points;
}

/**
 * Creates a material for flight paths with a glowing effect
 * @param color - The base color of the path
 * @param glowPower - Power of the glow effect
 * @param taperPower - Power of the tapering effect
 * @returns A material compatible with Cesium
 */
export function createFlightPathMaterial(
  color: Cesium.Color = Cesium.Color.BLUE,
  glowPower: number = 0.2,
  taperPower: number = 1.0
): Cesium.Material | Cesium.MaterialProperty {
  try {
    // Try to use PolylineGlowMaterialProperty if available
    // Note: Not all Cesium versions support taperPower, so we check for compatibility
    const propertyOptions: Record<string, Cesium.Property> = {
      glowPower: new Cesium.ConstantProperty(glowPower),
      color: new Cesium.ConstantProperty(color)
    };
    
    // Only add taperPower if the Cesium version supports it
    // This avoids the TypeScript error about unknown properties
    if ('taperPower' in Cesium.PolylineGlowMaterialProperty.prototype) {
      // This is a workaround for TypeScript - at runtime this will work if supported
      (propertyOptions as any).taperPower = new Cesium.ConstantProperty(taperPower);
    }
    
    return new Cesium.PolylineGlowMaterialProperty(propertyOptions);
  } catch (e) {
    // Fallback to simple color material
    try {
      return new Cesium.ColorMaterialProperty(color.withAlpha(0.7));
    } catch (e2) {
      // Final fallback if ColorMaterialProperty is not available
      return Cesium.Material.fromType('Color', {
        color: color.withAlpha(0.7)
      });
    }
  }
}

/**
 * Configures the Cesium viewer with optimal settings for a realistic globe
 * @param viewer - The Cesium viewer instance
 */
export function configureViewer(viewer: Cesium.Viewer): void {
  if (!viewer) return;
  
  try {
    // Enable lighting based on sun position
    viewer.scene.globe.enableLighting = true;
    
    // Show atmosphere and space background
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.hueShift = 0.0;
      viewer.scene.skyAtmosphere.saturationShift = 0.1;
      viewer.scene.skyAtmosphere.brightnessShift = 0.1;
    }
    
    // Show sun if available
    if (viewer.scene.sun) {
      viewer.scene.sun.show = true;
    }
    
    // Show stars in the skybox if available
    if (viewer.scene.skyBox) {
      viewer.scene.skyBox.show = true;
    }
    
    // Set space background
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#2a2a2a'); // Significantly brightened background
    
    // Enable anti-aliasing if available
    if (viewer.scene.postProcessStages?.fxaa) {
      viewer.scene.postProcessStages.fxaa.enabled = true;
    }
    
    // Set minimum zoom distance
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100000; // 100 km
    
    // Set time to now for proper sun positioning
    try {
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    } catch (e) {
      console.warn('Failed to set current time:', e);
    }
    
    // Configure shadows if available
    if (viewer.shadowMap) {
      viewer.shadowMap.enabled = true;
      viewer.shadowMap.softShadows = true;
    }
  } catch (e) {
    console.warn('Error configuring viewer:', e);
  }
}

/**
 * Get a random position within a specific region for distributing entities
 * @param centerLat - Center latitude of the region
 * @param centerLng - Center longitude of the region 
 * @param maxDistance - Maximum distance in degrees from the center
 * @returns Object with latitude and longitude
 */
export function getRandomPosition(
  centerLat: number = 39.8283,
  centerLng: number = -98.5795,
  maxDistance: number = 20
): { lat: number; lng: number } {
  // Generate random offset
  const latOffset = (Math.random() - 0.5) * 2 * maxDistance;
  const lngOffset = (Math.random() - 0.5) * 2 * maxDistance;
  
  return {
    lat: centerLat + latOffset,
    lng: centerLng + lngOffset
  };
}

/**
 * Create a material property with color and alpha
 * @param baseColor - The base color
 * @param alpha - Alpha value (0-1)
 * @returns A color material property
 */
export function createColorMaterial(
  baseColor: Cesium.Color,
  alpha: number = 0.5
): Cesium.MaterialProperty {
  try {
    return new Cesium.ColorMaterialProperty(baseColor.withAlpha(alpha));
  } catch (e) {
    // Fallback for older Cesium versions
    console.warn('Error creating color material:', e);
    return new Cesium.PolylineOutlineMaterialProperty({
      color: new Cesium.ConstantProperty(baseColor.withAlpha(alpha)),
      outlineWidth: new Cesium.ConstantProperty(0)
    });
  }
}

export default {
  createCurvedPath,
  createFlightPathMaterial,
  configureViewer,
  getRandomPosition,
  createColorMaterial
};