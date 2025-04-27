'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface EnhancedSunProps {
  position?: [number, number, number];
}

// Enhanced Sun component with improved realistic effects
const EnhancedSun: React.FC<EnhancedSunProps> = ({ position = [-3, 0, 0] }) => {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Sprite>(null);
  const raysRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  
  // Create sun textures and effects
  const [sunTextures, setSunTextures] = useState<{
    corona: THREE.CanvasTexture | null;
    rays: THREE.CanvasTexture | null;
    surface: THREE.CanvasTexture | null;
  }>({
    corona: null,
    rays: null,
    surface: null
  });
  
  useEffect(() => {
    // Create solar corona texture
    const coronaCanvas = document.createElement('canvas');
    coronaCanvas.width = 1024;
    coronaCanvas.height = 1024;
    const coronaCtx = coronaCanvas.getContext('2d');
    
    if (coronaCtx) {
      // Outer glow
      const gradient = coronaCtx.createRadialGradient(512, 512, 0, 512, 512, 512);
      gradient.addColorStop(0, 'rgba(255, 230, 125, 1)');    // Core: bright yellow
      gradient.addColorStop(0.2, 'rgba(255, 160, 60, 0.8)');  // Mid: orange
      gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.4)');  // Outer: reddish
      gradient.addColorStop(0.7, 'rgba(255, 50, 20, 0.2)');   // Edge: dark red
      gradient.addColorStop(1, 'rgba(255, 20, 10, 0)');       // Fade out
      
      coronaCtx.fillStyle = gradient;
      coronaCtx.fillRect(0, 0, 1024, 1024);
      
      // Add noise for texture
      coronaCtx.globalCompositeOperation = 'overlay';
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.2;
        
        coronaCtx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
        coronaCtx.beginPath();
        coronaCtx.arc(x, y, radius, 0, Math.PI * 2);
        coronaCtx.fill();
      }
    }
    
    // Create solar rays texture
    const raysCanvas = document.createElement('canvas');
    raysCanvas.width = 1024;
    raysCanvas.height = 1024;
    const raysCtx = raysCanvas.getContext('2d');
    
    if (raysCtx) {
      // Base gradient
      const gradient = raysCtx.createRadialGradient(512, 512, 0, 512, 512, 512);
      gradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
      
      raysCtx.fillStyle = gradient;
      raysCtx.fillRect(0, 0, 1024, 1024);
      
      // Draw rays
      raysCtx.save();
      raysCtx.translate(512, 512);
      
      // Many layers of rays with different opacities and lengths
      for (let layer = 0; layer < 3; layer++) {
        const rayCount = 12 + layer * 8;
        const maxLength = 400 + layer * 100;
        const opacity = 0.5 - layer * 0.15;
        
        raysCtx.strokeStyle = `rgba(255, 230, 180, ${opacity})`;
        raysCtx.lineWidth = 4 - layer;
        
        for (let i = 0; i < rayCount; i++) {
          const angle = (Math.PI * 2) * (i / rayCount);
          const length = maxLength * (0.7 + Math.random() * 0.3);
          
          raysCtx.beginPath();
          raysCtx.moveTo(0, 0);
          raysCtx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
          raysCtx.stroke();
        }
      }
      
      raysCtx.restore();
    }
    
    // Create sun surface texture with details and granulation
    const surfaceCanvas = document.createElement('canvas');
    surfaceCanvas.width = 1024;
    surfaceCanvas.height = 1024;
    const surfaceCtx = surfaceCanvas.getContext('2d');
    
    if (surfaceCtx) {
      // Base orange-yellow
      surfaceCtx.fillStyle = '#FDB813';
      surfaceCtx.fillRect(0, 0, 1024, 1024);
      
      // Add solar granulation (cell-like pattern)
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = 5 + Math.random() * 15;
        const brightness = 0.85 + Math.random() * 0.3; // Some brighter, some darker
        
        // Create cell gradient
        const cellGradient = surfaceCtx.createRadialGradient(
          x, y, 0,
          x, y, radius
        );
        
        const color = brightness > 1 
          ? `rgba(255, ${Math.floor(230 * brightness)}, ${Math.floor(150 * brightness)}, 0.7)`
          : `rgba(${Math.floor(253 * brightness)}, ${Math.floor(184 * brightness)}, ${Math.floor(19 * brightness)}, 0.7)`;
        
        cellGradient.addColorStop(0, color);
        cellGradient.addColorStop(1, 'rgba(253, 184, 19, 0)');
        
        surfaceCtx.fillStyle = cellGradient;
        surfaceCtx.beginPath();
        surfaceCtx.arc(x, y, radius, 0, Math.PI * 2);
        surfaceCtx.fill();
      }
      
      // Add a few solar prominences (brighter spots)
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = 30 + Math.random() * 70;
        
        const prominenceGradient = surfaceCtx.createRadialGradient(
          x, y, 0,
          x, y, radius
        );
        
        prominenceGradient.addColorStop(0, 'rgba(255, 255, 220, 0.9)');
        prominenceGradient.addColorStop(0.5, 'rgba(255, 200, 80, 0.5)');
        prominenceGradient.addColorStop(1, 'rgba(253, 184, 19, 0)');
        
        surfaceCtx.fillStyle = prominenceGradient;
        surfaceCtx.beginPath();
        surfaceCtx.arc(x, y, radius, 0, Math.PI * 2);
        surfaceCtx.fill();
      }
    }
    
    // Convert to textures
    setSunTextures({
      corona: coronaCtx ? new THREE.CanvasTexture(coronaCanvas) : null,
      rays: raysCtx ? new THREE.CanvasTexture(raysCanvas) : null,
      surface: surfaceCtx ? new THREE.CanvasTexture(surfaceCanvas) : null
    });
  }, []);
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (sunRef.current) {
      // Subtle pulsing effect and slow rotation
      const scale = 1.0 + Math.sin(time * 0.3) * 0.03;
      sunRef.current.scale.set(scale, scale, scale);
      sunRef.current.rotation.z = time * 0.02;
    }
    
    if (coronaRef.current) {
      // Corona rotation and pulse
      coronaRef.current.rotation.z = time * 0.01;
      const coronaScale = 12 + Math.sin(time * 0.2) * 0.5;
      coronaRef.current.scale.set(coronaScale, coronaScale, 1);
    }
    
    if (raysRef.current) {
      // Rays rotation in opposite direction and different pulse frequency
      raysRef.current.rotation.z = -time * 0.005;
      const raysScale = 16 + Math.sin(time * 0.15) * 1;
      raysRef.current.scale.set(raysScale, raysScale, 1);
    }
    
    if (haloRef.current) {
      // Outer halo subtle movement
      haloRef.current.rotation.z = time * 0.007;
      const haloScale = 20 + Math.sin(time * 0.1) * 1;
      haloRef.current.scale.set(haloScale, haloScale, 1);
    }
  });
  
  return (
    <group position={position}>
      {/* Sun core with surface texture */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial 
          map={sunTextures.surface || undefined} 
          emissive="#FFDC73" 
          emissiveIntensity={1.2}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh scale={0.65}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#FFF4C0" 
          transparent={true} 
          opacity={0.7}
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
      
      {/* Corona sprite */}
      {sunTextures.corona && (
        <sprite ref={coronaRef} scale={[12, 12, 1]}>
          <spriteMaterial 
            map={sunTextures.corona} 
            transparent={true}
            blending={THREE.AdditiveBlending}
            opacity={0.7}
          />
        </sprite>
      )}
      
      {/* Solar rays */}
      {sunTextures.rays && (
        <sprite ref={raysRef} scale={[16, 16, 1]}>
          <spriteMaterial 
            map={sunTextures.rays} 
            transparent={true}
            blending={THREE.AdditiveBlending}
            opacity={0.5}
          />
        </sprite>
      )}
      
      {/* Outer halo */}
      {sunTextures.corona && (
        <sprite ref={haloRef} scale={[20, 20, 1]}>
          <spriteMaterial 
            map={sunTextures.corona} 
            transparent={true}
            blending={THREE.AdditiveBlending}
            opacity={0.3}
          />
        </sprite>
      )}
      
      {/* Point light from the sun */}
      <pointLight 
        color="#FFF8E7" 
        intensity={3} 
        distance={15} 
        decay={1} 
      />
      
      {/* Additional subtle ambient light */}
      <ambientLight intensity={0.3} color="#FFE0A3" />
    </group>
  );
};

// Enhanced Aurora shader with more realistic effects
const createAuroraShader = () => {
  return {
    uniforms: {
      time: { value: 0 },
      colorGreen: { value: new THREE.Color(0x14ff00) },  // Base green
      colorPurple: { value: new THREE.Color(0xd10fd1) }, // Purple tip
      colorBlue: { value: new THREE.Color(0x0088ff) }    // Blue accent
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorGreen;
      uniform vec3 colorPurple;
      uniform vec3 colorBlue;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      // Improved noise function for more natural patterns
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        // Improved smoothstep
        vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
        
        float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
        float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
        float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
        float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
        
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      
      void main() {
        // Calculate latitude (0 at equator, 1 at poles)
        float latitude = abs(vNormal.y);
        
        // Only show at high latitudes near poles
        if (latitude > 0.65) {
          // Multiple layers of noise with different speeds and scales
          float n1 = noise(vec2(vUv.x * 3.0 + time * 0.2, vUv.y * 8.0));
          float n2 = noise(vec2(vUv.x * 5.0 - time * 0.1, vUv.y * 10.0));
          float n3 = noise(vec2(vUv.x * 7.0 + time * 0.05, vUv.y * 15.0));
          
          // Combine noise layers for more organic look
          float noiseVal = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);
          
          // Shape into curtain-like structure
          float curtain = smoothstep(0.4, 0.6, noiseVal) * smoothstep(0.95, 0.5, latitude);
          
          // Add vertical rays/bands effect
          float bands = sin(vUv.x * 30.0 + time) * 0.5 + 0.5;
          bands *= sin(vUv.x * 20.0 - time * 0.7) * 0.5 + 0.5;
          
          // Add subtle movement
          bands *= sin(vUv.y * 5.0 + time * 0.3) * 0.3 + 0.7;
          
          // Combine for final intensity
          float intensity = curtain * bands * (0.7 + 0.3 * sin(time * 0.3));
          
          // Skip pixels below threshold to create less uniform look
          if (intensity > 0.1) {
            // Color gradient based on height and time
            float blueInfluence = sin(vUv.x * 10.0 + time * 0.2) * 0.5 + 0.5;
            vec3 auroraColor = mix(
              mix(colorGreen, colorBlue, blueInfluence * 0.5), 
              colorPurple, 
              noise(vec2(vUv.y * 2.0 - time * 0.1, vUv.x * 3.0))
            );
            
            gl_FragColor = vec4(auroraColor, intensity * 0.7);
            return;
          }
        }
        gl_FragColor = vec4(0.0);
      }
    `
  };
};

// Location marker component
interface LocationMarkerProps {
  position: [number, number, number];
  name: string;
  selected?: boolean;
  onClick?: () => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, name, selected = false, onClick }) => {
  const markerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame(({ clock }) => {
    if (markerRef.current) {
      // Keep marker facing the camera
      markerRef.current.rotation.y = clock.getElapsedTime() * 0.2;
      
      // Pulse effect when selected or hovered
      if (selected || hovered) {
        const scale = 1.0 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
        markerRef.current.scale.set(scale, scale, scale);
      } else {
        markerRef.current.scale.set(1, 1, 1);
      }
    }
  });
  
  return (
    <group position={position}>
      <mesh 
        ref={markerRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial 
          color={selected ? "#ffdd00" : (hovered ? "#00ffff" : "#ffffff")} 
          emissive={selected ? "#ffaa00" : (hovered ? "#00aaff" : "#aaaaaa")}
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Label that appears on hover or selection */}
      {(hovered || selected) && (
        <Html
          position={[0, 0.05, 0]}
          center
          distanceFactor={10}
        >
          <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
};

// Enhanced Earth component
interface EnhancedEarthProps {
  backgroundMode?: boolean;
  interactive?: boolean;
  handleRegionClick?: (region: string) => void;
}

// Function to convert lat/long to 3D position on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 1): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return [x, y, z];
};

const EnhancedEarth: React.FC<EnhancedEarthProps> = ({ backgroundMode = false, interactive = false, handleRegionClick }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const auroraRef = useRef<THREE.Mesh>(null);
  const nightLightsRef = useRef<THREE.Mesh>(null);
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [nightLightsTexture, setNightLightsTexture] = useState<THREE.Texture | null>(null);
  
  // Demo locations - in a real app, these would come from your data
  const locations = useMemo(() => [
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Sydney", lat: -33.8688, lng: 151.2093 },
    { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
    { name: "Cairo", lat: 30.0444, lng: 31.2357 },
    { name: "Moscow", lat: 55.7558, lng: 37.6173 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "Shanghai", lat: 31.2304, lng: 121.4737 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
    { name: "Dubai", lat: 25.2048, lng: 55.2708 },
    { name: "Singapore", lat: 1.3521, lng: 103.8198 }
  ], []);
  
  // Convert locations to 3D positions
  const locationPositions = useMemo(() => {
    return locations.map(loc => ({
      ...loc,
      position: latLngToVector3(loc.lat, loc.lng, 1.02)  // Slightly above surface
    }));
  }, [locations]);
  
  // Create aurora shader
  const auroraShader = useMemo(() => createAuroraShader(), []);
  const auroraUniforms = useMemo(() => ({ ...auroraShader.uniforms }), [auroraShader]);
  
  // Create a night lights texture
  useEffect(() => {
    const texture = createNightLightsTexture();
    setNightLightsTexture(texture);
  }, []);
  
  // Function to create a fallback for the night lights texture
  const createNightLightsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Fill with black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw random city lights clusters
    const drawCluster = (x: number, y: number, size: number, density: number) => {
      const lights = size * density;
      for (let i = 0; i < lights; i++) {
        const distance = Math.random() * size;
        const angle = Math.random() * Math.PI * 2;
        const lightX = x + Math.cos(angle) * distance;
        const lightY = y + Math.sin(angle) * distance;
        const radius = Math.random() * 2 + 0.5;
        
        // Create glow
        const glow = ctx.createRadialGradient(
          lightX, lightY, 0,
          lightX, lightY, radius * 3
        );
        glow.addColorStop(0, 'rgba(255, 240, 180, 0.8)');
        glow.addColorStop(0.5, 'rgba(255, 240, 180, 0.3)');
        glow.addColorStop(1, 'rgba(255, 240, 180, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lightX, lightY, radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Create light center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(lightX, lightY, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    
    // Map locations to canvas coordinates
    locations.forEach(location => {
      // Convert lat/lng to x/y coordinates on the canvas
      // Canvas: x=0 is left edge, x=1024 is right edge, y=0 is top, y=512 is bottom
      // Map: lng=-180 is left edge, lng=180 is right edge, lat=-90 is bottom, lat=90 is top
      const x = ((location.lng + 180) / 360) * canvas.width;
      const y = ((90 - location.lat) / 180) * canvas.height;
      
      // Draw a city light cluster at this location
      drawCluster(x, y, 10 + Math.random() * 20, 3 + Math.random() * 3);
    });
    
    // Add some random smaller clusters for other cities
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = 100 + Math.random() * 300; // Keep within reasonable latitudes
      const size = Math.random() * 10 + 2;
      const density = Math.random() * 2 + 0.5;
      drawCluster(x, y, size, density);
    }
    
    // Convert to texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };
  
  // Load Earth textures
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    
    // Create a checkered texture for testing
    const createFallbackTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillRect(1, 1, 1, 1);
        ctx.fillStyle = '#152a40';
        ctx.fillRect(1, 0, 1, 1);
        ctx.fillRect(0, 1, 1, 1);
      }
      return new THREE.CanvasTexture(canvas);
    };
    
    // Use base64 encoded data URLs for small placeholder textures
    // In a production app, you'd use real texture files
    const earthMapBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCABkAGQDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUDBAYBAv/EABgBAQEBAQEAAAAAAAAAAAAAAAABAgME/9oADAMBAAIQAxAAAAHzKYOm+fTpG6rWMmtx6gSosbLzqbFKlnSlLXQYWBFUCnzJhGRtjK2qOQEsVbDa6hhtJmh0NuKnWI9KXaS6LH5r6vDQ+lhzNqp2KPNLE5RDWJeK38/PpTlN2Kcg04Uxn1LnmV5StWTtbHE50H3iCnYpRGFbFqR6i6rqTejm9QnPWL5uqG6rXVsA0JYzj/Z5q6vJzZPp6GY2GSZtCfJJuXnNNyTHQRa15pIKs9iKrLQAEkAAH//EACcQAAEEAQMDBAMBAAAAAAAAAAMBAgQFAAYREhMhFBAxMhUgIzBB/9oACAEBAAEFAvHiuFrRZtrZrxtx9sUdrRN53JQSCNqIpPWAkmnjjsLMcr3K+YojkmqtS6jNgH6ER3bHWkxbCWTHNHAZDZC5x/U5/p95yLSJ1SnubMqHxfpHOzx9XE46Tk6vIiRCkN2MfbVVXpGkjvbA41xo0DY8SGz0vD3KKNrLiKYz1GCaOC3HnOe7iF2B13jSZNcgGNb1GemXCWg2l+h7WPK6YBcCCo5zJIwRIIaihKZ1nq8/XnlsXHfEO3B/doPpjjTDuOKG7ej6ijxGnhLqK55HFbLdNFXiaqL7aouY66NRDgJwVSPqVmwtpDuMmS31F7VTcKe47OlnKq+eKIrfZ0mNCTm7uUFjuTz+KdSWUZZIV4PYzupyUvN5skqnZDkcSQwrFj6ooSl9mjxFe3BVnMF+oMWbMYpEPOYvoGYoWOg3LozmBhW0y8dHtYkZ3RnO5qrJAq/H3ZP19YrT28QomHnMBYVQSv/EAB4RAAIBBAMBAAAAAAAAAAAAAAABAhARITEDEiJB/9oACAEDAQE/AeR6LHRzRWMSXRR2MkX6TsrZzVXw+mKR14kJJlHcyF0RnH//xAAYEQEBAQEBAAAAAAAAAAAAAAABABECEP/aAAgBAgEBPwGMWMLFW7hj1hiJ8YtWXX//xAA2EAABAwEEBggEBgMAAAAAAAABAAIDERIhMVEEECIyQWEQE0JSYnGRoQUggcEUI3KCsdEzQ3P/2gAIAQEABj8CtUDnDZfZFFvKfzOaKLrI6VDhVtLxTbVS00Q1UwzREZwJoWlWoNOtQvGXEIhxDmDijcbPTHMfK660Nb9UZ53B5NXOJwFahE5yPrFJWmXRS43G4qQwO2XOxGaNTRGNj3DPzWzo7SFRX1UQ7bMK4i7opG0PJxPFCDq7LnbwxVo0qTciRvHxIxxtssc8lZdsmm8U+sZEIyOCkfICIWXDLVZJoL1FOANpzRRb7XtBPDgtzaK1RnkLRU0Gaqy53qmPGhiOSTcVkU0e18vNPEkdoxXpE4iOPLmrVpNZp0V9D3irkGk3HFRzhpcyaleCMVNHM+Sz7YUZkF1KZoA11HVRRuO80IoAYYmsN9aKlqtVpRJ2qVFORXRXDipG5EoE3F1/luVIx1g+NzS/8z2nUUEZdIOJWjubuuBIPggY5Wx6SWkW28b/AHVZXMZ3W07l6xt6ujuedtxJH0TInUbJbFAc6puhaKeRrvKuYrPxHSNzFuPiqTf5Bw+6tPNp7t9/sqWaW+JpVaVRMmgdGdoAVBUYljdGSPUBXR2HM7NKK7asOtfEDmKLZ35T6qV8TtrBODgSWm5DUbTMsMF+RV5EfJNZEKMbcqb0yqF0F9CipI77JdeLqs84aEu3hktINlRXTR1JZbumabwmErmPfUgUwXZFEHE3prtYkifXSxdlUZKtdWw5NKlkedrBtcEH6VM+I+IUVrj93Nw8WqJzCQx7QcUYwdmN108o/RX7qwacnOPksZIv0n+gg5l7CNtv2QY7dPZPFBzTVpxCZYFBIK/X5Q6OZkV2/wDJYCWXhgMU0aSSXOFaO9rk6NsZLXMIc2vBEHEJ12yeKc8DZtXqw97P+QXYd6ouN8lL+9VfeLRvCw81QXCuCo7EXg803mcVRjiNXWBl2GPlvWXjW/8AfIXBZrdy1f/EACgQAQABAwMEAgEFAQAAAAAAAAERACExQVFhcYGRobEQwdHh8PEgMP/aAAgBAQABPyH+EICtijXEXqRLq7U8vamQKDvTADNuaVtDxU1Z3o0Frd7UQi3jFBQgwcUGHPRrxr0O9Pv1mnfavf4hEUvtTJGm9JhbhimjD2ojhS9ukYeKVbg7gfRdvQ/r0n4LxXVe9HQNpk5AxSWA3D9+atSPDRNzq6hUghsG7x/FEEYUqVb84+Ot/wBEVJKsXpZgsnNFZeS7/N6DfhvS9PEO4UqJGhXA9NXqSm0GqE4MUyMw5ww9Vgggha5KYWJhhwIagGsZmgJNKIqgpU+UVYFnRnxTzDsDSmA7J+KDYnMF+Kbbb8QUa3UWbXloyGjFKA7JUgC5DNc4QI0vWeZK3qSAzBfUqSBnSgCLQiB1v5oPm7BWBxA0AeP+04fkpGQVUB+3mjRgxcMHemEzHdooHNQTz6qO2G07x7xREkLFr+KsLaSBQZjLRFFyBmzTiMVJ1Y8UFHkudXyUVnM38wFuKi4aBeK1BERl3o+iRMIJu3pINKCB4ovqtBa9gNNKE0V+aRBJpWpxP7oBiTmzQYxcjHsqzPbRlpEuEmfVQ+KcWiibFqEVrpHjBTb4TmG9I6sXtZ3Uo1SFrE/RVkNgJGPXuiQyXRxQhZzN58VzT3QBLBvGfVGjGVV19UpCL8QVYyRDy1a9Gg8UNrNqGGzjNAZKUaM0RNkd+9BaRlKCXQTApsmC05owqISCWn5wJiACHWbVKyiMXXoqwRqBftmphxPFBTl1TLvRAeSTNKXbYBuXpISRDFT+J0rCDmEp8FG2VWDI9qmDDIxTg6X7H1U76Qw2r3S3bJWG0sU6BtbuPeNKRiVNJ8fjR9V+SzxCt1j+SKeMPj8fwMfqEOKFgFQV4hZcFGBvAvTXk/5StC1YPRTkI+V3OKuuLfR4rAyLiU04XWn5u0nszTGFPq1P4tSHpH+qUv6vvWh7jmgXa4fzpRoTG8HV/NK06LJ2FFBfL+aHpT4KNlMHdfzNGnY1R1pRDHbY3NKZSh0nwzQ18uFTW0aRn+q+G+t5xVtOClwtH5KeaLgn5dAjTgUAgvhLmKNkGE0l/wA6oFhWJvahCUuJT6P8r//aAAwDAQACAAMAAAAQ8888888888kU8888sSZc88888VoE88o20d8nG8Q88Mbc8s88888v8888as8gd88kE88888888888888//8QAHhEBAQADAAMBAQEAAAAAAAAAAQARIRAxQVEgYXH/2gAIAQMBAT8Q72XJcY6XHGTpOOLNLHDe7kQ2TCCZDcgDtj+xb5T6yTbGZHTdOstwY9mMxjnuZBvD5ItxK8f/xAAcEQEAAwADAQEAAAAAAAAAAAABABEhMRBBUWH/2gAIAQIBAT8Qw2n1lYw+RfZYOZTPdDiVWxCt1FGCuGvcsjAw58gxTmCEQwxkFM//xAAmEAEBAAICAQQCAgMBAAAAAAABEQAhMUFRYXGBkRChscHR4fDx/9oACAEBAAE/EPwG5W0qTrCzfq4KwUIHI4iqqKcnvDSh0aS8JEY2lHJkK0G2rFxKgBqDaRXEqG84UJ0wJWpXHDMVFvzjJEWJxc2NqhQmSk8NbjAMVRQ3yZbVZAqPK2MVAJvgWahUNNpsMvNB3PmxVVTDxKA0NB2zTVt4JtR6/CJADrLQXDSRUBUj0yszJRhRyJX1MupLRFqeTPobIlq9MLu4vYRYg3g8WdwHXMLlZwC/3X8UYkajMpxC0NOOy+GK1o+tYhIiprqe/wA4N4NPTAU78MR2teTgWbPn1/nDFQd0DZg0fU/fxW3Sxg7CehlBtXc1pVwxIYMiLR7Vdm4QeVoGkVc3RK8LUh2s2tpNK/K3QQ4DTMmw0JepJplwtI/A0z3MAFAmOvQG9ZpJETfSnjAWE4pLZ79YQBOzqnRVLlACFVB0UUBnWNEIuqbHgynHUm4o7tSGw33hVdWhJPIi4Lx+BcATwP36zb6BLPq7MEIaOC0dfzgJMBdQS60vb2wDNlRQhQSVCFE7GDXnNoF9EkQ7d9EwJsDLyCiFG90uNUVwAdSe2mEtdLJ8sLPcMa6MICeXnjFbwXlVN8qDMFI1dD39cOQVSBaY0QIRRsQeQ5PXWHAVNe+l/GKQmgQ2ODixI/rFbJy0jKI3JHHBgLQ0gYMBRohWX5H10fRYJwl2Wa8uh3kk3BQXpL8AKBFVTYRzgnCKmQwApGrwtdyxIiVEMglQEjgSqfRGkAmhWLSrTIEACGPtbr4t0t4Kv0MNKu6+qYMIQIeQ3+8qhT4gGQlYCdw3e8ACAC7c9CGsrB3gx1jjgd6w3ZAWZBuIL4BPfAKDI9UX98LFNhdP94PvPU+6v5wgvQaQT8xsxAF3wOTcFYWiLxqCeQkdTqpAVIJG0h0RQmqMQW2LxQBM35MMRXrARXfZnNUAgtIPiGJcxwGMTqOSLyEowKx19FaLDg0QHO+cRgRFFQOu8m4LqcO/wdsmCDAJQEgejH2wJXsUoHoGqoiDRTIFEQBc0kJOIyq7Hu/S/jLWxSd4AtVgLdBJ5PaX+cVAEZwWY9Xx84d2FVG2NU4qfHOO5jQEaOlDm3k0BQaQgIEDcZ84aQYMAf4Hf/OLxgVKBtvoG/bOHGmBxJd8z9GKTsEzY9P8YNYDAilXXTvpA4JGOkxXdSCgGvjcPOETWc6tOGT54wZKiB3xtTzxhsRbIZAZAiCQQdFBhZUSEDWIzCYWIgrTxrCdcIxgv+m8jdR0W1wDQqV1xvDpDGUBIIm8IgKCMnRsb35OcOSjFUbOO6GDuQBpHgJ4xYMXX3QCPWGNg3JR8mz43kEGjsVbqeeKqgxobVdPGsKRrG5rA6rY/jF0E9nWLBJLwSPzjkGhYZLgBdVJRkB6ntiC7F1TK3e+R6wzAYJpJ07A7wGVT0oe+LiPXbXzDX1iga+jicb2LrFEErSlDQRKcY5Rl3VJOYm04yEZJRXJc0xZDQtC8c0B5OaYDDTUAjUTsE9O8U2a2AsCl9tZU9IG0aGvIbXFYPwJPrE1qGJEA0cOXKdBiggeqYaHKVDWx6Ywlt0Qy4JBLnQJ4woITUUqBPbBeXgsBrgZAJiGW5oEe1JFx4xSkBdUppVd5J7jyZEe/N0HZlyNlFCxQgqcccnONAIhDpJfvAm8AdoMZ0NEqEegw1a3RSyKqvfBRXRt3T4UyBFY9KxOCvwi51Aa8RFwFswoQ9L6Ye4LRUFfW+MJc0v1TBY+UwIJQPrBFxWqp4R+cSAJEpBN/UyXgXD0Jid/gDn6T//Z';
    const earthCloudsBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE3mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTAzLTI2VDE3OjMyOjU3KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wNC0wMlQyMzoxNDo0MyswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMC0wNC0wMlQyMzoxNDo0MyswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NWMxYjI1NmMtYTJlZS0wZTQyLWEzNDYtOGI2ZTc5ZmQxODVhIiB4bXBNTTpEb2N1bWVudElE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';
    
    const loadTexture = async (dataUrl: string): Promise<THREE.Texture> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          resolve(texture);
        };
        img.src = dataUrl;
      });
    };
    
    // Load all textures in parallel
    Promise.all([
      loadTexture(earthMapBase64),
      loadTexture(earthCloudsBase64),
      // Using the earth map for both normal and specular maps as placeholders
      loadTexture(earthMapBase64),
      loadTexture(earthMapBase64)
    ]).then((loadedTextures: THREE.Texture[]) => {
      setTextures(loadedTextures);
      setLoaded(true);
    }).catch(error => {
      console.error('Error loading textures:', error);
      // Use fallback textures
      setTextures([
        createFallbackTexture(),
        createFallbackTexture(),
        createFallbackTexture(),
        createFallbackTexture()
      ]);
      setLoaded(true);
    });
  }, []);
  
  // Animation for globe rotation and effects
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (earthRef.current && !selectedLocation) {
      // Slow, smooth rotation
      earthRef.current.rotation.y = time * 0.05;
    }
    
    if (cloudsRef.current) {
      // Clouds rotate slightly faster than Earth
      cloudsRef.current.rotation.y = time * 0.055;
    }
    
    if (auroraRef.current && auroraUniforms.time) {
      // Update aurora animation time
      auroraUniforms.time.value = time;
    }
    
    if (nightLightsRef.current && earthRef.current) {
      // Keep night lights aligned with Earth rotation
      nightLightsRef.current.rotation.y = earthRef.current.rotation.y;
    }
  });
  
  const handleLocationClick = (location: { name: string; lat: number; lng: number; position: [number, number, number] }) => {
    if (selectedLocation === location.name) {
      // If already selected, deselect
      setSelectedLocation(null);
    } else {
      // Select this location
      setSelectedLocation(location.name);
      
      // Send location to parent component
      if (handleRegionClick) {
        // Format: name,lat,lng
        handleRegionClick(`${location.name},${location.lat},${location.lng}`);
      }
      
      // Rotate globe to face the location
      if (earthRef.current) {
        // Calculate rotation to face the location
        const targetLng = THREE.MathUtils.degToRad(location.lng);
        // Smoothly animate to the target rotation
        const currentRotation = earthRef.current.rotation.y;
        const targetRotation = -targetLng;
        
        // Animate rotation (simplified version)
        let startTime: number | null = null;
        const duration = 1000; // ms
        
        const animate = (timestamp: number): void => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Use easing function for smoother animation
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          if (earthRef.current) {
            earthRef.current.rotation.y = currentRotation + (targetRotation - currentRotation) * easeProgress;
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      }
    }
  };
  
  if (!loaded || textures.length < 3 || !nightLightsTexture) {
    return null;
  }
  
  // Extract textures
  const [dayMap, cloudsMap, normalMap, specularMap] = textures;
  
  return (
    <>
      {/* Earth with day texture */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={dayMap}
          normalMap={normalMap || undefined}
          specularMap={specularMap || undefined}
          shininess={10}
          bumpMap={normalMap}
          bumpScale={0.05}
        />
      </mesh>
      
      {/* Night lights (only visible on dark side) */}
      <mesh ref={nightLightsRef}>
        <sphereGeometry args={[1.001, 64, 64]} />
        <meshBasicMaterial 
          map={nightLightsTexture}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Location markers */}
      {interactive && locationPositions.map((location) => (
        <LocationMarker
          key={location.name}
          position={location.position}
          name={location.name}
          selected={location.name === selectedLocation}
          onClick={() => handleLocationClick(location)}
        />
      ))}
      
      {/* Clouds layer */}
      <mesh ref={cloudsRef} scale={1.003}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      
      {/* Aurora effect at poles */}
      <mesh ref={auroraRef} scale={1.15}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial 
          vertexShader={auroraShader.vertexShader}
          fragmentShader={auroraShader.fragmentShader}
          uniforms={auroraUniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Multiple layers of atmosphere for more realistic glow */}
      <mesh scale={1.12}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial 
          color="#4ca6ff"
          transparent={true}
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Additional outer haze */}
      <mesh scale={1.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#4F7FDB"
          transparent={true}
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

interface EnhancedGlobeContentProps {
  onRegionSelect: (region: string) => void;
  backgroundMode?: boolean;
  interactive?: boolean;
}

// Main globe component with enhanced visuals
export default function EnhancedGlobeContent({ 
  onRegionSelect, 
  backgroundMode = false,
  interactive = false
}: EnhancedGlobeContentProps) {
  const handleRegionSelect = (region: string) => {
    if (onRegionSelect) {
      onRegionSelect(region);
    }
  };

  return (
    <div className={`h-full ${backgroundMode ? 'pointer-events-auto' : ''}`}>
      <Canvas 
        camera={{ position: [0, 0, backgroundMode ? 3.2 : 2.5], fov: 45 }}
        style={{ 
          background: 'radial-gradient(circle at center, #060d2c, #000000)',
          pointerEvents: backgroundMode ? 'auto' : 'none'
        }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]} // Responsive resolution
      >
        {/* Space background */}
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[50, 50, 1, 1]} />
          <meshBasicMaterial color="#000010" />
        </mesh>
        
        {/* Star field for background */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade={true} />
        
        {/* Scene lighting - dimmer ambient to make night side darker */}
        <ambientLight intensity={0.05} />
        
        {/* Enhanced sun with realistic effects */}
        <EnhancedSun position={[-3, 0, 0]} />
        
        {/* Earth and its effects */}
        <EnhancedEarth 
          backgroundMode={backgroundMode}
          interactive={interactive}
          handleRegionClick={handleRegionSelect}
        />
        
        {/* Controls - different settings based on mode */}
        <OrbitControls 
          enableZoom={interactive}
          enablePan={false}
          minDistance={backgroundMode ? 2.5 : 1.5}
          maxDistance={backgroundMode ? 5 : 3.5}
          rotateSpeed={0.3}
          autoRotate={!interactive}
          autoRotateSpeed={0.5}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}