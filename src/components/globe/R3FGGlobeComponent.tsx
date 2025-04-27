'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from '@/lib/types';

// Helper to convert lat/long to 3D position on sphere
const latLongToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

interface LocationMarkerProps {
  position: THREE.Vector3;
  color?: string;
  isSelected?: boolean;
  onClick: () => void;
}

// Marker component for displaying a location
const LocationMarker: React.FC<LocationMarkerProps> = ({ 
  position, 
  color = '#3b82f6', 
  isSelected = false, 
  onClick 
}) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);
  
  // Animation effect
  useFrame((state) => {
    if (ref.current) {
      if (isSelected || hovered) {
        // Pulse animation when selected or hovered
        ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = 
          1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
      } else {
        // Return to normal size
        ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = 1;
      }
    }
  });
  
  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.01, 16, 16]} />
      <meshStandardMaterial 
        color={isSelected ? '#ffdd00' : (hovered ? '#00c2ff' : color)} 
        emissive={isSelected ? '#ffaa00' : (hovered ? '#00aaff' : color)}
        emissiveIntensity={0.5}
      />
      
      {/* Add a glowing halo */}
      <mesh scale={1.5}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshBasicMaterial 
          color={isSelected ? '#ffaa00' : (hovered ? '#00aaff' : color)} 
          transparent={true}
          opacity={0.3}
        />
      </mesh>
    </mesh>
  );
};

interface LocationLabelProps {
  position: THREE.Vector3;
  label: string;
  isVisible: boolean;
}

// Label component for displaying info about a location
const LocationLabel: React.FC<LocationLabelProps> = ({ position, label, isVisible }) => {
  const { camera } = useThree();
  const [pos, setPos] = useState<[number, number, number]>([0, 0, 0]);
  const size = 0.08;
  
  useFrame(() => {
    if (isVisible) {
      // Project the 3D position to 2D screen space for proper label positioning
      const projectedPosition = position.clone();
      projectedPosition.project(camera);
      
      // Convert to normalized space
      setPos([
        projectedPosition.x,
        projectedPosition.y,
        projectedPosition.z
      ]);
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <sprite
      position={[pos[0] * 1.1, pos[1] * 1.1, pos[2] * 1.1]}
      scale={[size, size, 1]}
    >
      <spriteMaterial
        transparent
        opacity={0.8}
        depthTest={false}
      >
        <canvasTexture 
          attach="map" 
          image={createLabelCanvas(label)} 
          premultiplyAlpha 
        />
      </spriteMaterial>
    </sprite>
  );
};

// Create a canvas with text for the label
function createLabelCanvas(text: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
  if (ctx) {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split text into multiple lines if needed
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width < canvas.width - 20) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    
    // Draw each line
    const lineHeight = 30;
    const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, i) => {
      if (ctx) {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      }
    });
  }
  
  return canvas;
}

// Helper function to create a fallback texture if loading fails
const createFallbackTexture = (
  color: string = '#1565C0',
  width: number = 256,
  height: number = 256
): THREE.Texture => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Fill with base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add some gradient for depth
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some noise for texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2;
      const alpha = Math.random() * 0.05;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }
  
  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
};

interface EarthProps {
  children: React.ReactNode;
}

// The enhanced Earth component with all layers and the sun
const Earth: React.FC<EarthProps> = ({ children }) => {
  // References for all the rotating elements
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const sunGlowRef = useRef<THREE.Mesh>(null);
  
  // Create fallback textures
  const [earthTextureFallback] = useState(() => createFallbackTexture('#1565C0'));
  const [cloudsTextureFallback] = useState(() => createFallbackTexture('#FFFFFF', 512, 512));
  const [nightTextureFallback] = useState(() => createFallbackTexture('#000033'));
  
  // State for textures
  const [earthTexture, setEarthTexture] = useState<THREE.Texture>(earthTextureFallback);
  const [cloudsTexture, setCloudsTexture] = useState<THREE.Texture>(cloudsTextureFallback);
  const [nightTexture, setNightTexture] = useState<THREE.Texture>(nightTextureFallback);
  
  // Manual texture loading with error handling
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const textureUrls = [
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'
    ];
    
    const loadTexture = (url: string, setter: (texture: THREE.Texture) => void, fallback: THREE.Texture) => {
      textureLoader.load(
        url,
        texture => {
          setter(texture);
        },
        undefined,
        () => {
          console.warn(`Failed to load texture: ${url}, using fallback`);
          setter(fallback);
        }
      );
    };
    
    loadTexture(textureUrls[0], setEarthTexture, earthTextureFallback);
    loadTexture(textureUrls[1], setCloudsTexture, cloudsTextureFallback);
    loadTexture(textureUrls[2], setNightTexture, nightTextureFallback);
    
  }, [earthTextureFallback, cloudsTextureFallback, nightTextureFallback]);
  
  // Animation for all elements
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate the Earth
    if (earthRef.current) {
      earthRef.current.rotation.y = elapsedTime * 0.05;
    }
    
    // Rotate the clouds slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.06;
    }
    
    // Rotate the atmosphere with Earth
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = elapsedTime * 0.05;
    }
    
    // Slight pulsing for the sun glow
    if (sunGlowRef.current) {
      const pulseScale = 1 + Math.sin(elapsedTime * 0.5) * 0.03;
      sunGlowRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });

  return (
    <group>
      {/* Earth sphere with the realistic texture */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={earthTexture}
          bumpScale={0.05}
          specularMap={nightTexture}
          specular={new THREE.Color(0x666666)}
          shininess={10}
          opacity={1}
          transparent={false}
        />
        {children}
      </mesh>
      
      {/* Night side lights */}
      <mesh rotation={[0, Math.PI, 0]} ref={earthRef}>
        <sphereGeometry args={[1.001, 64, 64]} />
        <meshBasicMaterial 
          map={nightTexture}
          transparent={true}
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Cloud layer */}
      <mesh ref={cloudsRef} scale={1.003}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={cloudsTexture}
          transparent={true}
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      
      {/* Atmosphere */}
      <mesh ref={atmosphereRef} scale={1.15}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          color="#4ca6ff"
          side={THREE.BackSide}
          transparent={true}
          opacity={0.2}
          emissive="#4ca6ff"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Sun peeking from behind (positioned to left side) */}
      <mesh ref={sunRef} position={[-10, 0, -10]} scale={5}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      
      {/* Sun glow effect */}
      <mesh ref={sunGlowRef} position={[-10, 0, -10]} scale={6}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#FFF5E0"
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sun light rays */}
      <directionalLight 
        position={[-10, 0, -10]} 
        intensity={2} 
        color="#FFFCF0" 
      />
      
      {/* Additional ambient light for overall visibility */}
      <ambientLight intensity={0.2} />
    </group>
  );
};

// Main Globe Component
interface GlobeComponentProps {
  groups: Group[];
  onGroupSelect?: (group: Group) => void;
  selectedGroupId?: string;
  initialCoordinates?: { lat: number; lng: number } | null;
  height?: string | number;
  width?: string | number;
  className?: string;
}

interface LocationMarkerData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  position: THREE.Vector3;
  group: Group;
}

const R3FGGlobeComponent: React.FC<GlobeComponentProps> = ({
  groups,
  onGroupSelect,
  selectedGroupId,
  initialCoordinates,
  height = '100%',
  width = '100%',
  className = '',
}) => {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const controlsRef = useRef<any>();
  
  // Update selected marker when selectedGroupId changes
  useEffect(() => {
    if (selectedGroupId) {
      setSelectedMarkerId(selectedGroupId);
    }
  }, [selectedGroupId]);

  // Generate markers from groups
  const locationMarkers: LocationMarkerData[] = groups.map(group => {
    // Get coordinates from the group data
    let lat: number, lng: number;
    
    if (group.geo_location && group.geo_location.coordinates && Array.isArray(group.geo_location.coordinates)) {
      // Using geo_location field (format may vary based on your database)
      [lng, lat] = group.geo_location.coordinates;
    } else {
      // Fallback for testing - random coordinates around the US
      lat = 37.0902 + (Math.random() - 0.5) * 10;
      lng = -95.7129 + (Math.random() - 0.5) * 20;
    }
    
    // Convert to 3D position
    const position = latLongToVector3(lat, lng, 1.02); // Slightly larger than Earth radius
    
    return {
      id: group.id,
      name: group.name,
      lat,
      lng, 
      position,
      group
    };
  });
  
  // Handle marker click
  const handleMarkerClick = (marker: LocationMarkerData) => {
    setSelectedMarkerId(marker.id);
    if (onGroupSelect) {
      onGroupSelect(marker.group);
    }
    
    // Focus the camera on the selected marker
    if (controlsRef.current) {
      const targetPosition = latLongToVector3(marker.lat, marker.lng, 1);
      
      // Calculate the camera position
      const phi = (90 - marker.lat) * (Math.PI / 180);
      const theta = (marker.lng + 180) * (Math.PI / 180);
      
      // Position camera to look at the target from a distance
      const distance = 1.8;
      const cameraX = -distance * Math.sin(phi) * Math.cos(theta);
      const cameraY = distance * Math.cos(phi);
      const cameraZ = distance * Math.sin(phi) * Math.sin(theta);
      
      controlsRef.current.target.set(targetPosition.x, targetPosition.y, targetPosition.z);
      controlsRef.current.object.position.set(cameraX, cameraY, cameraZ);
      controlsRef.current.update();
    }
  };
  
  // Set up initial view based on initialCoordinates
  useEffect(() => {
    if (initialCoordinates && controlsRef.current) {
      const { lat, lng } = initialCoordinates;
      const targetPosition = latLongToVector3(lat, lng, 1);
      
      // Calculate the camera position
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      // Position camera to look at the target from a distance
      const distance = 1.8;
      const cameraX = -distance * Math.sin(phi) * Math.cos(theta);
      const cameraY = distance * Math.cos(phi);
      const cameraZ = distance * Math.sin(phi) * Math.sin(theta);
      
      controlsRef.current.target.set(targetPosition.x, targetPosition.y, targetPosition.z);
      controlsRef.current.object.position.set(cameraX, cameraY, cameraZ);
      controlsRef.current.update();
    }
  }, [initialCoordinates, controlsRef.current]);

  return (
    <div className={`${className}`} style={{ height, width, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ 
          background: 'radial-gradient(circle at center, #060d2c, #000000)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          antialias: true,
          alpha: false, // Disable transparency to fix the duplicate globe issue
          preserveDrawingBuffer: true
        }}
      >
        {/* Add stars background */}
        <Stars radius={300} depth={100} count={5000} factor={5} saturation={0.5} fade={true} />
        
        {/* Ambient light */}
        <ambientLight intensity={0.1} />
        
        {/* Camera controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.5}
          maxDistance={4}
          rotateSpeed={0.3}
          zoomSpeed={0.7}
          enableDamping
          dampingFactor={0.1}
        />
        
        {/* Earth with enhanced effects */}
        <Suspense fallback={null}>
          <Earth>
            {/* Render all location markers */}
            {locationMarkers.map(marker => (
              <React.Fragment key={marker.id}>
                <LocationMarker
                  position={marker.position}
                  isSelected={marker.id === selectedMarkerId}
                  onClick={() => handleMarkerClick(marker)}
                />
                
                {/* Show labels for selected or hovered markers */}
                <LocationLabel
                  position={marker.position}
                  label={marker.name}
                  isVisible={marker.id === selectedMarkerId || marker.id === hoveredMarkerId}
                />
              </React.Fragment>
            ))}
          </Earth>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default R3FGGlobeComponent;