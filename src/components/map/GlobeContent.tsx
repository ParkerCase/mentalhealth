'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Sun component with dramatic rays effect
const DramaticSun = ({ position = [-2.5, 0, 0] }) => {
  const sunRef = useRef();
  const flareRef = useRef();
  const raysRef = useRef();
  
  // Create lens flare textures
  const [flareTexture, setFlareTexture] = useState(null);
  
  useEffect(() => {
    // Create lens flare effect
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Draw a radial gradient for the lens flare
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 230, 170, 1)');
    gradient.addColorStop(0.1, 'rgba(255, 180, 100, 0.8)');
    gradient.addColorStop(0.2, 'rgba(255, 140, 40, 0.6)');
    gradient.addColorStop(0.4, 'rgba(255, 100, 30, 0.4)');
    gradient.addColorStop(0.8, 'rgba(255, 50, 10, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 50, 10, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Create rays
    ctx.save();
    ctx.translate(256, 256);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2) * (i / 20);
      const length = 200 + Math.random() * 50;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Convert to texture
    const texture = new THREE.CanvasTexture(canvas);
    setFlareTexture(texture);
  }, []);
  
  useFrame(({ clock }) => {
    if (sunRef.current) {
      // Subtle pulsing effect
      const time = clock.getElapsedTime();
      const scale = 1.0 + Math.sin(time * 0.5) * 0.05;
      sunRef.current.scale.set(scale, scale, scale);
    }
    
    if (flareRef.current) {
      // Subtle flare rotation
      flareRef.current.rotation.z = clock.getElapsedTime() * 0.05;
      const pulseScale = 1.0 + Math.sin(clock.getElapsedTime() * 0.7) * 0.1;
      flareRef.current.scale.set(pulseScale * 6, pulseScale * 6, 1);
    }
    
    if (raysRef.current) {
      // Rotate rays in opposite direction
      raysRef.current.rotation.z = -clock.getElapsedTime() * 0.02;
      const rayScale = 1.2 + Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
      raysRef.current.scale.set(rayScale * 8, rayScale * 8, 1);
    }
  });
  
  return (
    <group position={position}>
      {/* Sun core */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial 
          color="#FFDC73" 
          transparent={true} 
          opacity={0.7} 
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial 
          color="#FF6C10" 
          transparent={true} 
          opacity={0.3} 
        />
      </mesh>
      
      {/* Lens flare effect */}
      {flareTexture && (
        <sprite ref={flareRef} scale={[6, 6, 1]}>
          <spriteMaterial 
            map={flareTexture} 
            transparent={true}
            blending={THREE.AdditiveBlending}
            opacity={0.8}
          />
        </sprite>
      )}
      
      {/* Sun rays */}
      {flareTexture && (
        <sprite ref={raysRef} scale={[8, 8, 1]}>
          <spriteMaterial 
            map={flareTexture} 
            transparent={true}
            blending={THREE.AdditiveBlending}
            opacity={0.4}
          />
        </sprite>
      )}
      
      {/* Point light from the sun */}
      <pointLight 
        color="#FFF8E7" 
        intensity={3} 
        distance={10} 
        decay={1} 
      />
    </group>
  );
};

// Advanced Aurora shader that looks more like the reference photo
const createAuroraShader = () => {
  return {
    uniforms: {
      time: { value: 0 },
      colorGreen: { value: new THREE.Color(0x14ff00) },  // Base green
      colorPurple: { value: new THREE.Color(0xd10fd1) }, // Purple tip
      colorRed: { value: new THREE.Color(0xff0000) }     // Red tint
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
      uniform vec3 colorRed;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      // Improved noise function for more natural patterns
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        // Quintic interpolation
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
        if (latitude > 0.7) {
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
          
          // Combine for final intensity
          float intensity = curtain * bands * (0.7 + 0.3 * sin(time * 0.3));
          
          // Skip pixels below threshold to create less uniform look
          if (intensity > 0.1) {
            // Color gradient from green base to purple/red tops
            vec3 auroraColor = mix(
              colorGreen, 
              mix(colorPurple, colorRed, noise(vec2(vUv.x * 2.0, time * 0.1))), 
              noise(vec2(vUv.y * 2.0 - time * 0.05, vUv.x * 3.0))
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

// Custom atmospheric glow effect
const AtmosphereGlow = () => {
  const atmosphereRef = useRef();
  
  useFrame(({ clock }) => {
    if (atmosphereRef.current) {
      // Subtle breathing effect
      const time = clock.getElapsedTime();
      const scale = 1.0 + Math.sin(time * 0.2) * 0.01;
      atmosphereRef.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <mesh ref={atmosphereRef} scale={1.12}>
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
  );
};

// Function to create a fallback for the night lights texture
const createNightLightsTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fill with black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw random city lights clusters
  const drawCluster = (x, y, size, density) => {
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
  
  // Major city regions (x, y, size, density)
  // North America
  drawCluster(256, 200, 80, 3);
  // Europe
  drawCluster(512, 180, 60, 4);
  // Asia
  drawCluster(700, 220, 100, 3);
  // Japan
  drawCluster(800, 200, 30, 5);
  // India
  drawCluster(650, 250, 40, 4);
  // Australia
  drawCluster(800, 350, 30, 2);
  // South America
  drawCluster(320, 350, 50, 2);
  // Africa
  drawCluster(520, 300, 40, 1.5);
  
  // Add smaller random clusters
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = 100 + Math.random() * 300; // Keep in the middle-ish latitude band
    const size = Math.random() * 20 + 5;
    const density = Math.random() * 2 + 0.5;
    drawCluster(x, y, size, density);
  }
  
  // Convert to texture
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

// Enhanced Earth component
const Earth = ({ handleRegionClick }) => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const auroraRef = useRef();
  const nightLightsRef = useRef();
  const [textures, setTextures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [nightLightsTexture, setNightLightsTexture] = useState(null);
  
  // Create aurora shader
  const auroraShader = useMemo(() => createAuroraShader(), []);
  const auroraUniforms = useMemo(() => ({ ...auroraShader.uniforms }), [auroraShader]);
  
  // Create a fallback night lights texture
  useEffect(() => {
    const texture = createNightLightsTexture();
    setNightLightsTexture(texture);
  }, []);
  
  // Fix crossorigin warning
  const crossOriginSetup = { crossOrigin: 'anonymous' };
  
  // Load textures with error handling and crossorigin setup
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const textureLoader = new THREE.TextureLoader();
        
        // Apply crossOrigin to the loader
        textureLoader.setCrossOrigin('anonymous');
        
        const loadTexture = (url) => {
          return new Promise((resolve, reject) => {
            textureLoader.load(
              url, 
              texture => resolve(texture),
              undefined,
              error => {
                console.warn(`Could not load texture ${url}:`, error);
                const canvas = document.createElement('canvas');
                canvas.width = 2;
                canvas.height = 2;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#1e3a5f';
                  ctx.fillRect(0, 0, 2, 2);
                }
                const fallbackTexture = new THREE.CanvasTexture(canvas);
                resolve(fallbackTexture);
              }
            );
          });
        };
        
        // Using placeholder URLS - replace with your actual texture paths
        const textureURLs = [
          '/earth-map.jpg',          // Day texture
          '/earth-clouds.png',       // Clouds texture
          '/earth-normal-map.jpg',   // Normal map
          '/earth-specular-map.jpg'  // Specular map
        ];
        
        // Load all textures in parallel
        const loadedTextures = await Promise.all(
          textureURLs.map(url => loadTexture(url))
        );
        
        setTextures(loadedTextures);
        setLoaded(true);
      } catch (error) {
        console.error('Error loading textures:', error);
        setLoaded(true); // Continue even with errors
      }
    };
    
    loadTextures();
  }, []);
  
  // Animation for globe rotation and effects
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (earthRef.current && !selectedRegion) {
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
      <AtmosphereGlow />
      
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

// Small star field component for background density
const StarField = () => {
  // Create a dense field of small stars
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      // Color
      const r = 0.9 + Math.random() * 0.1;
      const g = 0.9 + Math.random() * 0.1;
      const b = 0.9 + Math.random() * 0.1;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
      
      // Size
      sizes[i] = Math.random();
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
  // Create material for particles with point attenuation and alpha
  const starsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
  }, []);
  
  return <points geometry={starsGeometry} material={starsMaterial} />;
};

// Space background gradient
const SpaceBackground = () => {
  const { viewport } = useThree();
  
  // Create a gradient background as a plane filling the entire view
  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2, 1, 1]} />
      <meshBasicMaterial color="#000010" />
    </mesh>
  );
};

// Main globe component
export default function GlobeContent({ onRegionSelect }) {
  return (
    <div className="h-full">
      <Canvas 
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ background: 'radial-gradient(circle at center, #060d2c, #000000)' }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]} // Responsive resolution
      >
        {/* Space background */}
        <SpaceBackground />
        
        {/* Star field for background */}
        <StarField />
        
        {/* Scene lighting - dimmer ambient to make night side darker */}
        <ambientLight intensity={0.05} />
        
        {/* Dramatic sun with rays from left side */}
        <DramaticSun position={[-3, 0, 0]} />
        
        {/* Earth and its effects */}
        <Earth handleRegionClick={onRegionSelect} />
        
        {/* Background stars from drei */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade={true} />
        
        {/* Controls - better presets for realistic interaction */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={1.5}
          maxDistance={3.5}
          rotateSpeed={0.3}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}