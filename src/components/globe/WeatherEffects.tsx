'use client';

import { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import * as Cesium from 'cesium';

// Add missing type definitions for ParticleSystem and CircleEmitter
declare global {
  namespace Cesium {
    class ParticleSystem {
      constructor(options: any);
    }
    
    class CircleEmitter {
      constructor(radius: number);
      radius: number;
    }
  }
}

// Fixed: Explicitly define WeatherType to include 'clear'
type WeatherType = 'clouds' | 'storm' | 'fog' | 'clear';

interface WeatherEffectsProps {
  type?: WeatherType;
  intensity?: number; // 0 to 1
  location?: {
    lat: number;
    lng: number;
    radius: number; // km
  };
  animate?: boolean;
}

/**
 * Adds weather and atmosphere effects to the globe
 */
const WeatherEffects: React.FC<WeatherEffectsProps> = ({
  type = 'clear',
  intensity = 0.5,
  location,
  animate = true
}) => {
  const { viewer, scene } = useCesium();
  const particleSystemRef = useRef<any | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup function for particle systems
  const cleanupParticleSystem = () => {
    if (particleSystemRef.current && scene) {
      try {
        scene.primitives.remove(particleSystemRef.current);
      } catch (e) {
        console.warn('Failed to remove particle system:', e);
      }
      particleSystemRef.current = null;
    }
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Initialize and configure weather effects
  useEffect(() => {
    if (!viewer || !scene) return;
    
    // Clean up any existing effects
    cleanupParticleSystem();
    
    // Configure atmosphere based on weather type
    if (scene.skyAtmosphere) {
      switch (type) {
        case 'storm':
          scene.skyAtmosphere.hueShift = -0.15;
          scene.skyAtmosphere.saturationShift = -0.25 * intensity;
          scene.skyAtmosphere.brightnessShift = -0.2 * intensity;
          break;
        case 'fog':
          scene.skyAtmosphere.hueShift = 0;
          scene.skyAtmosphere.saturationShift = -0.3 * intensity;
          scene.skyAtmosphere.brightnessShift = 0.15 * intensity;
          break;
        case 'clouds':
          scene.skyAtmosphere.hueShift = 0;
          scene.skyAtmosphere.saturationShift = -0.1 * intensity;
          scene.skyAtmosphere.brightnessShift = 0.05 * intensity;
          break;
        case 'clear':
        default:
          scene.skyAtmosphere.hueShift = 0;
          scene.skyAtmosphere.saturationShift = 0;
          scene.skyAtmosphere.brightnessShift = 0;
          break;
      }
    }
    
    // Only create particle systems for non-clear weather
    if (type === 'clear') return;
    
    // Set up simple atmosphere effects if Cesium version doesn't support ParticleSystem
    try {
      if (!Cesium.ParticleSystem) {
        // Fallback to simple atmosphere adjustments
        if (scene.skyAtmosphere) {
          // Create a lightning flash effect for storms
          if (type === 'storm' && animate && intensity > 0.4) {
            const flashLightning = () => {
              if (!scene) return;
              
              // Random lightning flash
              if (Math.random() < 0.01 * intensity && scene.skyAtmosphere) {
                scene.skyAtmosphere.brightnessShift += 0.4;
                setTimeout(() => {
                  if (scene.skyAtmosphere) {
                    scene.skyAtmosphere.brightnessShift -= 0.4;
                  }
                }, 150);
              }
              
              animationRef.current = requestAnimationFrame(flashLightning);
            };
            
            flashLightning();
          }
        }
        return;
      }
      
      // Fixed: Now type comparison works correctly with the updated WeatherType
      if (type !== 'clear' && Cesium.ParticleSystem) {
        try {
          const defaultPosition = Cesium.Cartesian3.fromDegrees(
            location?.lng ?? -95, 
            location?.lat ?? 40, 
            location?.radius ? location.radius * 1000 : 500000
          );
          
          // Configure a simplified particle system
          particleSystemRef.current = new Cesium.ParticleSystem({
            image: '/assets/cloud.png',
            startScale: 1.0,
            endScale: 1.5,
            minimumParticleLife: 60,
            maximumParticleLife: 120,
            minimumSpeed: 10,
            maximumSpeed: 50,
            imageSize: new Cesium.Cartesian2(100, 100),
            emissionRate: 5 * intensity,
            lifetime: 16.0,
            emitter: new Cesium.CircleEmitter(location?.radius ? location.radius * 500 : 400000),
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(defaultPosition),
            startColor: new Cesium.Color(0.8, 0.8, 0.8, 0.3 * intensity),
            endColor: new Cesium.Color(0.8, 0.8, 0.8, 0.0)
          });
          
          scene.primitives.add(particleSystemRef.current);
        } catch (error) {
          console.warn('Failed to create weather particle system:', error);
        }
      }
    } catch (e) {
      console.warn('ParticleSystem not available in this Cesium version:', e);
    }
    
    // Cleanup
    return cleanupParticleSystem;
  }, [viewer, scene, type, intensity, location, animate]);

  // This component doesn't render anything directly
  return null;
};

export default WeatherEffects;