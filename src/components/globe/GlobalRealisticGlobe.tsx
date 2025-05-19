'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export interface GlobalRealisticGlobeProps {
  height?: string;
  width?: string;
  groups?: Array<{
    id: string;
    name: string;
    geo_location?: {
      type?: string;
      coordinates: number[];
    };
    city?: string;
    state?: string;
  }>;
  selectedGroupId?: string;
  onGroupSelect?: (group: any) => void;
  initialCoordinates?: { lat: number; lng: number };
  autoRotate?: boolean;
  performanceLevel?: 'low' | 'medium' | 'high' | 'ultra';
  weatherType?: 'clear' | 'clouds' | 'fog' | 'storm';
  weatherIntensity?: number;
  markerType?: 'pin' | 'dot' | 'pulse';
  showSatellites?: boolean;
  debugInfo?: boolean;
}

// Export the component with forwardRef to properly handle refs from parent components
const GlobalRealisticGlobe = forwardRef<any, GlobalRealisticGlobeProps>((props, ref) => {
  const {
    height = '100vh',
    width = '100%',
    groups = [],
    selectedGroupId,
    onGroupSelect,
    initialCoordinates,
    autoRotate = true,
    performanceLevel = 'medium',
    weatherType = 'clear',
    weatherIntensity = 0.5,
    markerType = 'pulse',
    showSatellites = false,
    debugInfo = false
  } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const animationRef = useRef<number | null>(null);
  const cloudsRef = useRef<Cesium.Entity[]>([]);
  const satellitesRef = useRef<Cesium.Entity[]>([]);
  const markersRef = useRef<Cesium.Entity[]>([]);
  const earthRotationSpeed = useRef(0.02); // degrees per frame
  const earthRotationAngle = useRef(0);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  
  // For debug stats
  const frameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  // Function to fly to a specific location
  const flyToLocation = useCallback((lat: number, lng: number, height: number = 2000000) => {
    if (!viewerRef.current) return;
    
    try {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-50),
          roll: 0
        },
        duration: 3,
        complete: () => {
          if (autoRotate) stopEarthRotation();
        }
      });
    } catch (error) {
      console.error("Error flying to location:", error);
    }
  }, [autoRotate]);

  // Search location by address - can be exposed through ref to parent components
  const searchLocation = useCallback(async (searchText: string) => {
    if (!viewerRef.current) return;
    
    try {
      // Simple geocoding using Cesium's ion Geocoder service if available
      if ((Cesium as any).IonGeocoderService) {
        const geocoder = new (Cesium as any).IonGeocoderService({ scene: viewerRef.current.scene });
        const results = await geocoder.geocode(searchText);
        
        if (results && results.length > 0) {
          const result = results[0];
          // Use type assertion for the position property
          const pos = result.position as any;
          flyToLocation(pos.y, pos.x, 2000000);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error searching location:", error);
      return false;
    }
  }, [flyToLocation]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    
    let isInitialized = false;
    
    const createViewer = () => {
      try {
        // Create hidden credits container
        const credits = document.createElement('div');
        credits.style.display = 'none';
        
        // Create custom imagery provider collection
        const imageryLayers = new Cesium.ImageryLayerCollection();
        
        // Create the viewer with configuration
        const viewer = new Cesium.Viewer(containerRef.current!, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          creditContainer: credits,
          // Use baseLayerPicker: false instead of imageryProvider: false
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          requestRenderMode: performanceLevel !== 'ultra',
          maximumRenderTimeChange: performanceLevel === 'ultra' ? 0 : Infinity,
          targetFrameRate: performanceLevel === 'ultra' ? 60 : 30
        });
        
        viewerRef.current = viewer;
        const scene = viewer.scene;
        const globe = scene.globe;
        
        // Configure viewer basics
        scene.backgroundColor = Cesium.Color.BLACK;
        scene.moon = undefined as any; // Remove default moon
        scene.sun = undefined as any; // Remove default sun (we'll create our own)
        
        // Enhanced day/night cycle settings
        globe.enableLighting = true;
        globe.baseColor = Cesium.Color.fromCssColorString('#23374d'); // Deeper ocean color
        globe.showGroundAtmosphere = true;
        
        // Create enhanced sun
const customSun = new Cesium.Sun();
        scene.sun = customSun;
        
        // Enhanced atmosphere
        if (scene.skyAtmosphere) {
          scene.skyAtmosphere.hueShift = 0.0;
          scene.skyAtmosphere.saturationShift = 0.1;
          scene.skyAtmosphere.brightnessShift = 0.1; 
          scene.skyAtmosphere.atmosphereLightIntensity = 5.0;
          scene.skyAtmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(
            0.0000055, 0.0000013, 0.0000005
          );
          scene.skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(
            0.0000033, 0.0000033, 0.0000033
          );
        }
        
        // Enhanced lighting
        globe.dynamicAtmosphereLighting = true;
        globe.dynamicAtmosphereLightingFromSun = true;
        
        // Add custom imagery layers
        try {
          // 1. Base earth texture with higher resolution
 const baseImagery = new Cesium.SingleTileImageryProvider({
  url: '/assets/earth-map.jpg', // Higher resolution earth texture
  rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
});
          
          const baseLayer = viewer.imageryLayers.addImageryProvider(baseImagery);
          baseLayer.brightness = 1.2; // Brighter for daytime
          baseLayer.contrast = 1.2; // Better contrast
          baseLayer.gamma = 1.1; // Better color representation
          
          // 2. Enhanced night lights with bright city centers
          const nightLights = new Cesium.SingleTileImageryProvider({
            url: '/assets/earth-night.jpg', // Higher resolution night lights
            rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
          });
          
          const nightLayer = viewer.imageryLayers.addImageryProvider(nightLights);
          nightLayer.alpha = 0.0; // Start with night lights invisible - we'll animate this
          nightLayer.brightness = 2.0; // Make the lights brighter
          nightLayer.contrast = 3.0; // More contrast for the lights
          nightLayer.gamma = 0.5; // Enhance night time glow
          
          // 3. Enhanced cloud layer with transparency and detail
          const cloudProvider = new Cesium.SingleTileImageryProvider({
            url: '/assets/earth-clouds.png', // Higher resolution clouds with transparency
            rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)
          });
          
          const cloudLayer = viewer.imageryLayers.addImageryProvider(cloudProvider);
          cloudLayer.alpha = weatherType === 'clear' ? 0.3 : 0.7 * weatherIntensity; // More realistic clouds
          cloudLayer.brightness = 1.2;
          
          // Enhanced day/night cycle based on earth rotation
          let lastTime = Date.now();
          const nightCycle = () => {
            if (!viewer.isDestroyed() && nightLayer) {
              const currentTime = Date.now();
              const elapsed = currentTime - lastTime;
              lastTime = currentTime;
              
              // Calculate sunlight direction using earth rotation angle
              const sunPosition = new Cesium.Cartesian3();
              const lightDir = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(
                Cesium.JulianDate.now(), 
                sunPosition
              );
              
              // Calculate hemisphere lighting based on sun position
              const centerOfEarth = Cesium.Cartesian3.ZERO;
              const sunDirection = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.subtract(sunPosition, centerOfEarth, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
              );
              
              // Adjust night lights visibility based on sun position
              // This uses a more complex algorithm that creates a gradient effect
              const viewPosition = viewer.camera.position;
              const viewToCenterDir = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.negate(viewPosition, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
              );
              
              const viewDotSun = Cesium.Cartesian3.dot(viewToCenterDir, sunDirection);
              const angle = Math.acos(viewDotSun);
              
              // Calculate a smoother transition for night lights
              const transition = Math.min(1.0, Math.max(0.0, (angle - 1.3) * 2.0));
              
              // Apply night lights alpha based on transition
              nightLayer.alpha = transition * 1.5; // Brighter night lights
              
              // Dynamically adjust cloud brightness based on day/night
              if (cloudLayer) {
                cloudLayer.brightness = 1.5 - (transition * 0.5);
              }
              
              // Update terrain lighting
              if (globe.dynamicAtmosphereLighting) {
                globe.atmosphereLightIntensity = 5.0 - (transition * 3.0);
              }
              
              // Update FPS counter for debug
              if (debugInfo) {
                frameCountRef.current++;
                const now = performance.now();
                if (now - lastUpdateTimeRef.current >= 1000) {
                  setFps(frameCountRef.current);
                  frameCountRef.current = 0;
                  lastUpdateTimeRef.current = now;
                }
              }
            }
            
            animationRef.current = requestAnimationFrame(nightCycle);
          };
          
          // Start night cycle animation
          animationRef.current = requestAnimationFrame(nightCycle);
          
        } catch (error) {
          console.error('Error setting up custom imagery:', error);
          // Fallback to default imagery if custom textures fail
          const defaultProvider = new Cesium.UrlTemplateImageryProvider({
            url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII/{z}/{x}/{y}.jpg')
          });
          viewer.imageryLayers.addImageryProvider(defaultProvider);
        }
        
        // Configure performance settings
        setupPerformanceSettings(viewer, performanceLevel);
        
        // Set initial camera position - look at Earth from a distance
        let initializedFromCoordinates = false;
        if (initialCoordinates) {
          try {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                initialCoordinates.lng,
                initialCoordinates.lat,
                4000000
              ),
              orientation: {
                heading: 0,
                pitch: -Math.PI / 3, // Look down at Earth at an angle
                roll: 0
              },
              duration: 0 // Instant for initial view
            });
            initializedFromCoordinates = true;
          } catch (error) {
            console.error("Error setting initial coordinates:", error);
          }
        }
        
        // If no coordinates provided or they failed, use default view
        if (!initializedFromCoordinates) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
            orientation: {
              heading: 0,
              pitch: -Math.PI / 2, // Look straight down
              roll: 0
            }
          });
        }
        
        // Add atmospheric weather effects based on settings
        if (weatherType !== 'clear') {
          addWeatherEffects(viewer, weatherType, weatherIntensity);
        }
        
        // Add satellites if enabled
        if (showSatellites) {
          addSatellites(viewer);
        }
        
        // Set up earth rotation
        if (autoRotate && !initialCoordinates) {
          setupEarthRotation(viewer);
        }
        
        // Set up click handler
        setUpClickHandler(viewer);
        
        // Flag that viewer is ready for other components
        setIsViewerReady(true);
        isInitialized = true;
        
      } catch (error) {
        console.error("Error creating viewer:", error);
      }
    };
    
    createViewer();
    
    // Cleanup function
    return () => {
      isInitialized = false;
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [initialCoordinates, performanceLevel, weatherType, weatherIntensity, showSatellites, autoRotate, debugInfo]);
  
  // Effect to update markers when groups change
  useEffect(() => {
    if (!viewerRef.current || !isViewerReady) return;
    
    // Remove existing markers
    markersRef.current.forEach(entity => {
      if (viewerRef.current) viewerRef.current.entities.remove(entity);
    });
    markersRef.current = [];
    
    // Add new markers for each group
    groups.forEach(group => {
      if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return;
      
      try {
        const lng = group.geo_location.coordinates[0];
        const lat = group.geo_location.coordinates[1];
        const isSelected = selectedGroupId === group.id;
        
        // Create marker based on selected type
        const entity = createMarkerEntity(
          viewerRef.current!,
          group,
          lat,
          lng,
          isSelected,
          markerType
        );
        
        viewerRef.current!.entities.add(entity);
        markersRef.current.push(entity);
      } catch (error) {
        console.error(`Error adding marker for group ${group.id}:`, error);
      }
    });
  }, [groups, selectedGroupId, markerType, isViewerReady]);
  
  // Effect to manage rotation based on autoRotate and selectedGroupId
  useEffect(() => {
    if (!viewerRef.current || !isViewerReady) return;
    
    if (autoRotate && !selectedGroupId) {
      startEarthRotation();
    } else {
      stopEarthRotation();
    }
    
    return () => {
      stopEarthRotation();
    };
  }, [autoRotate, selectedGroupId, isViewerReady]);
  
  // Effect to handle weather effects changes
  useEffect(() => {
    if (!viewerRef.current || !isViewerReady) return;
    
    // Clear existing cloud entities
    cloudsRef.current.forEach(entity => {
      if (viewerRef.current) viewerRef.current.entities.remove(entity);
    });
    cloudsRef.current = [];
    
    // Add new weather effects based on current settings
    if (weatherType !== 'clear') {
      addWeatherEffects(viewerRef.current, weatherType, weatherIntensity);
    }
  }, [weatherType, weatherIntensity, isViewerReady]);
  
  // Effect to handle satellite display changes
  useEffect(() => {
    if (!viewerRef.current || !isViewerReady) return;
    
    // Clear existing satellites
    satellitesRef.current.forEach(entity => {
      if (viewerRef.current) viewerRef.current.entities.remove(entity);
    });
    satellitesRef.current = [];
    
    // Add satellites if enabled
    if (showSatellites) {
      addSatellites(viewerRef.current);
    }
  }, [showSatellites, isViewerReady]);
  
  // Function to create different marker types
  const createMarkerEntity = (
    viewer: Cesium.Viewer,
    group: any,
    lat: number,
    lng: number,
    isSelected: boolean,
    markerType: string
  ) => {
    const position = Cesium.Cartesian3.fromDegrees(lng, lat);
    
    // Base entity properties
    const entityOptions: Cesium.Entity.ConstructorOptions = {
      id: group.id,
      name: group.name,
      position: position,
      label: {
        text: group.name,
        font: '14px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        show: isSelected,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    };
    
    // Add marker-specific properties
    switch (markerType) {
      case 'pin':
        entityOptions.billboard = {
          image: isSelected ? '/assets/pin-blue.png' : '/assets/pin-red.png',
          scale: isSelected ? 0.5 : 0.4,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        };
        break;
        
      case 'pulse':
        // For pulse, we create an ellipse with animated material
        entityOptions.ellipse = {
          semiMinorAxis: 100000, // Size in meters
          semiMajorAxis: 100000,
          height: 0,
          material: new Cesium.ColorMaterialProperty(
            isSelected ? 
              Cesium.Color.BLUE.withAlpha(0.5) : 
              Cesium.Color.RED.withAlpha(0.3)
          ),
          outline: true,
          outlineColor: isSelected ? 
            Cesium.Color.BLUE.withAlpha(0.8) : 
            Cesium.Color.RED.withAlpha(0.6),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        };
        
        // Add a center point
        entityOptions.point = {
          pixelSize: isSelected ? 15 : 10,
          color: isSelected ? Cesium.Color.BLUE : Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        };
        break;
        
      case 'dot':
      default:
        entityOptions.point = {
          pixelSize: isSelected ? 15 : 10,
          color: isSelected ? Cesium.Color.BLUE : Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        };
        break;
    }
    
    return new Cesium.Entity(entityOptions);
  };
  
  // Set up the click handler for selecting groups
  const setUpClickHandler = (viewer: Cesium.Viewer) => {
    if (handlerRef.current) {
      handlerRef.current.destroy();
    }
    
    handlerRef.current = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handlerRef.current.setInputAction((click: any) => {
      if (!onGroupSelect) return;
      
      try {
        const pickedObject = viewer.scene.pick(click.position);
        
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;
          const selectedGroup = groups.find(g => g.id === entity.id);
          
          if (selectedGroup) {
            // Fly to the selected group
            const coords = selectedGroup.geo_location?.coordinates;
            if (coords && coords.length >= 2) {
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                  coords[0], 
                  coords[1], 
                  2000000 // Height in meters
                ),
                orientation: {
                  heading: 0,
                  pitch: -Math.PI / 4, // Look down at an angle
                  roll: 0
                },
                duration: 2
              });
            }
            
            if (onGroupSelect) {
              onGroupSelect(selectedGroup);
            }
          }
        }
      } catch (error) {
        console.error("Error handling click:", error);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };
  
  // Add satellites orbiting the Earth
  const addSatellites = (viewer: Cesium.Viewer) => {
    const numberOfSatellites = 12;
    const orbitRadius = 9000000; // 9,000 km
    const colors = [
      Cesium.Color.RED, 
      Cesium.Color.BLUE, 
      Cesium.Color.GREEN, 
      Cesium.Color.YELLOW,
      Cesium.Color.CYAN
    ];
    
    for (let i = 0; i < numberOfSatellites; i++) {
      try {
        // Calculate satellite position
        const angle = (i / numberOfSatellites) * Math.PI * 2;
        const inclination = (Math.random() * 60 - 30) * Math.PI / 180; // Random inclination
        
        // Create satellite entity with orbital path
        const satelliteEntity = viewer.entities.add({
          name: `Satellite-${i}`,
          
          // Position the satellite using a SampledPositionProperty for animation
          position: new Cesium.CallbackProperty((time) => {
            const elapsedSeconds = Cesium.JulianDate.secondsDifference(
              time, 
              viewer.clock.startTime
            );
            
            // Calculate orbital position with time
            const orbitalSpeed = 0.0001 * (1 + i % 3) * 2; // Different speeds
            const currentAngle = angle + (elapsedSeconds * orbitalSpeed);
            
            // Add slight inclination variation
            const x = orbitRadius * Math.cos(currentAngle);
            const y = orbitRadius * Math.sin(currentAngle) * Math.cos(inclination);
            const z = orbitRadius * Math.sin(currentAngle) * Math.sin(inclination);
            
            return new Cesium.Cartesian3(x, y, z);
          }, false) as any,
          
          // Satellite appearance
          point: {
            pixelSize: 5,
            color: colors[i % colors.length],
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          },
          
          // Add an orbit path
          path: {
            resolution: 360, // Number of points in path
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.2,
              color: colors[i % colors.length].withAlpha(0.3)
            }),
            width: 1,
            leadTime: 720000, // Path ahead (in seconds)
            trailTime: 720000  // Path behind (in seconds)
          }
        });
        
        satellitesRef.current.push(satelliteEntity);
      } catch (error) {
        console.error(`Error adding satellite ${i}:`, error);
      }
    }
  };
  
  
  // Add weather effects based on type and intensity
  const addWeatherEffects = (viewer: Cesium.Viewer, type: string, intensity: number) => {
    switch (type) {
      case 'clouds':
        addDynamicClouds(viewer, intensity);
        break;
      case 'storm':
        addStormClouds(viewer, intensity);
        break;
      case 'fog':
        addGlobalFog(viewer, intensity);
        break;
    }
  };
  
  // Add dynamic cloud cover
  const addDynamicClouds = (viewer: Cesium.Viewer, intensity: number) => {
    const numberOfClouds = Math.floor(10 + intensity * 20); // 10-30 clouds based on intensity
    
    for (let i = 0; i < numberOfClouds; i++) {
      try {
        // Random position
        const longitude = Math.random() * 360 - 180;
        const latitude = Math.random() * 180 - 90;
        const altitude = 10000 + Math.random() * 5000; // Cloud altitude variation
        
        // Cloud size based on intensity
        const cloudSize = 50000 + (intensity * 100000 * Math.random()); // 50km to 150km
        
        // Create cloud entity
        const cloudEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
          ellipse: {
            semiMinorAxis: cloudSize * (0.6 + Math.random() * 0.4), // Slight variation for more natural look
            semiMajorAxis: cloudSize,
            material: new Cesium.ImageMaterialProperty({
              image: '/assets/cloud.png',
              transparent: true
            }),
            height: altitude,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            outline: false,
            fill: true
          }
        });
        
        cloudsRef.current.push(cloudEntity);
      } catch (error) {
        console.error(`Error adding cloud ${i}:`, error);
      }
    }
  };
  
  // Add storm clouds
  const addStormClouds = (viewer: Cesium.Viewer, intensity: number) => {
    // First add regular clouds
    addDynamicClouds(viewer, intensity * 0.7);
    
    // Add storm-specific clouds (darker, larger)
    const numberOfStormCenters = Math.floor(3 + intensity * 5); // 3-8 storm centers based on intensity
    
    for (let i = 0; i < numberOfStormCenters; i++) {
      try {
        // Random position
        const longitude = Math.random() * 360 - 180;
        const latitude = Math.random() * 140 - 70; // Avoid poles
        const altitude = 15000 + Math.random() * 8000; // Higher storm clouds
        
        // Storm cloud size 
        const stormSize = 200000 + (intensity * 300000 * Math.random()); // 200km to 500km
        
        // Create storm cloud entity
        const stormEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
          ellipse: {
            semiMinorAxis: stormSize * 0.8,
            semiMajorAxis: stormSize,
            material: new Cesium.ImageMaterialProperty({
              image: '/assets/storm-cloud.png', // Darker cloud texture
              transparent: true
            }),
            height: altitude,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            outline: false,
            fill: true
          }
        });
        
        cloudsRef.current.push(stormEntity);
        
        // Add lightning effect with random intervals if intensity is high enough
        if (intensity > 0.6) {
          setInterval(() => {
            if (viewer.isDestroyed()) return;
            
            // Random position within the storm
            const lightningLong = longitude + (Math.random() * 4 - 2);
            const lightningLat = latitude + (Math.random() * 4 - 2);
            
            // Create a brief flash
            const lightning = viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(lightningLong, lightningLat, altitude - 2000),
              point: {
                pixelSize: 30 + Math.random() * 50,
                color: Cesium.Color.YELLOW.withAlpha(0.7),
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
              }
            });
            
            // Remove the lightning after a short flash
            setTimeout(() => {
              if (!viewer.isDestroyed()) {
                viewer.entities.remove(lightning);
              }
            }, 100 + Math.random() * 150);
          }, 3000 + Math.random() * 10000); // Random lightning interval
        }
      } catch (error) {
        console.error(`Error adding storm ${i}:`, error);
      }
    }
  };
  
  // Add global fog
  const addGlobalFog = (viewer: Cesium.Viewer, intensity: number) => {
    try {
      if (!viewer.scene.fog.enabled) {
        viewer.scene.fog.enabled = true;
      }
      
      // Adjust fog based on intensity
      viewer.scene.fog.density = 0.0001 + (intensity * 0.0005);
      viewer.scene.fog.screenSpaceErrorFactor = 2.0 + (intensity * 8.0);
      
      // Add some clouds for atmosphere
      addDynamicClouds(viewer, intensity * 0.3);
    } catch (error) {
      console.error("Error adding fog:", error);
    }
  };
  
  const setupEarthRotation = (viewer: Cesium.Viewer) => {
    let rotationAngle = 0;
    
    const tick = () => {
      if (!viewer.isDestroyed()) {
        // Rotate the camera around the globe
        rotationAngle += Cesium.Math.toRadians(earthRotationSpeed.current);
        earthRotationAngle.current = rotationAngle; // Track the rotation
        
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(earthRotationSpeed.current));
        
        animationRef.current = requestAnimationFrame(tick);
      }
    };
    
    if (autoRotate && !selectedGroupId) {
      animationRef.current = requestAnimationFrame(tick);
    }
  };

  const startEarthRotation = () => {
    if (!animationRef.current && viewerRef.current) {
      setupEarthRotation(viewerRef.current);
    }
  };

  const stopEarthRotation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

   const setupPerformanceSettings = (viewer: Cesium.Viewer, level: string) => {
    const scene = viewer.scene;
    const globe = scene.globe;
    
    switch (level) {
      case 'low':
        scene.fog.enabled = false;
        scene.skyAtmosphere.show = false;
        globe.enableLighting = false;
        // Fix fxaa property access
        (scene as any).fxaa = false;
        scene.postProcessStages.fxaa.enabled = false;
        globe.maximumScreenSpaceError = 4;
        globe.tileCacheSize = 100;
        scene.requestRenderMode = true;
        scene.maximumRenderTimeChange = Infinity;
        break;
        
      case 'high':
        scene.fog.enabled = true;
        scene.skyAtmosphere.show = true;
        globe.enableLighting = true;
        // Fix fxaa property access
        (scene as any).fxaa = true;
        if (scene.postProcessStages?.fxaa) {
          scene.postProcessStages.fxaa.enabled = true;
        }
        globe.maximumScreenSpaceError = 1.5;
        globe.tileCacheSize = 1000;
        scene.requestRenderMode = false;
        break;
        
      case 'ultra':
        scene.fog.enabled = true;
        scene.skyAtmosphere.show = true;
        globe.enableLighting = true;
        globe.dynamicAtmosphereLighting = true;
        globe.dynamicAtmosphereLightingFromSun = true;
        // Fix fxaa property access
        (scene as any).fxaa = true;
        if (scene.postProcessStages?.fxaa) {
          scene.postProcessStages.fxaa.enabled = true;
        }
        globe.maximumScreenSpaceError = 1.0;
        globe.tileCacheSize = 2000;
        scene.requestRenderMode = false;
        break;
        
      case 'medium':
      default:
        scene.fog.enabled = true;
        scene.skyAtmosphere.show = true;
        globe.enableLighting = true;
        // Fix fxaa property access
        (scene as any).fxaa = false;
        if (scene.postProcessStages?.fxaa) {
          scene.postProcessStages.fxaa.enabled = false;
        }
        globe.maximumScreenSpaceError = 2;
        globe.tileCacheSize = 500;
        scene.requestRenderMode = true;
        scene.maximumRenderTimeChange = 0.2;
        break;
    }
  };

  // Expose search and flyTo functions to parent via ref
  useImperativeHandle(ref, () => ({
    flyToLocation,
    searchLocation,
    viewer: viewerRef.current
  }), [flyToLocation, searchLocation, viewerRef.current]);

  return (
    <div style={{ 
      width: width, 
      height: height, 
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />
      
      {/* Debug info panel if enabled */}
      {debugInfo && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>FPS: {fps}</div>
          <div>Groups: {groups.length}</div>
          <div>Markers: {markersRef.current.length}</div>
          <div>Weather: {weatherType}</div>
          <div>Performance: {performanceLevel}</div>
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging
GlobalRealisticGlobe.displayName = 'GlobalRealisticGlobe';

export default GlobalRealisticGlobe;