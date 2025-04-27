'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from '@/lib/types';

// Helper to convert lat/long to 3D position on sphere
const latLongToVector3 = (lat, lng, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

// Marker component for displaying a location
const LocationMarker = ({ position, color = '#3b82f6', isSelected = false, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();
  
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

// Label component for displaying info about a location
const LocationLabel = ({ position, label, isVisible }) => {
  const { camera } = useThree();
  const [pos, setPos] = useState([0, 0, 0]);
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
function createLabelCanvas(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  
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
  let lines = [];
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
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });
  
  return canvas;
}

// The Earth component with textures and atmosphere
const Earth = ({ children }) => {
  // Create a TextureLoader for loading textures
  const [earthTexture, cloudsTexture, nightTexture] = useLoader(THREE.TextureLoader, [
    // Earth texture
    'https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg',
    // Clouds texture
    'https://unpkg.com/three-globe@2.24.10/example/img/earth-clouds.png',
    // Night texture
    'https://unpkg.com/three-globe@2.24.10/example/img/earth-night.jpg'
  ]);
  
  const earthRef = useRef();
  const cloudsRef = useRef();
  
  useFrame(({ clock }) => {
    // Rotate the earth slowly
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
    
    // Rotate the clouds slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.055;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={earthTexture}
          bumpScale={0.005}
          specularMap={nightTexture}
          specular={new THREE.Color('grey')}
          shininess={5}
        />
        
        {/* Add children (markers) */}
        {children}
      </mesh>
      
      {/* Night lights */}
      <mesh rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[1.001, 64, 64]} />
        <meshBasicMaterial 
          map={nightTexture}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Clouds layer */}
      <mesh ref={cloudsRef} scale={1.003}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={cloudsTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      
      {/* Atmosphere */}
      <mesh scale={1.15}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          color="#4ca6ff"
          side={THREE.BackSide}
          transparent
          opacity={0.2}
        />
      </mesh>
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

const R3FGlobeComponent: React.FC<GlobeComponentProps> = ({
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
  const locationMarkers = groups.map(group => {
    // Get coordinates from the group data
    let lat, lng;
    
    if (group.geo_location && group.geo_location.coordinates && Array.isArray(group.geo_location.coordinates)) {
      // Using geo_location field (format may vary based on your database)
      [lng, lat] = group.geo_location.coordinates;
    } else if (group.latitude && group.longitude) {
      // Some databases store lat/long directly
      lat = group.latitude;
      lng = group.longitude;
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
  const handleMarkerClick = (marker) => {
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
        style={{ background: 'radial-gradient(circle at center, #060d2c, #000000)' }}
      >
        {/* Add stars background */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade={true} />
        
        {/* Ambient light */}
        <ambientLight intensity={0.1} />
        
        {/* Main directional light (sun) */}
        <directionalLight 
          position={[-5, 3, 5]} 
          intensity={1} 
          color="#fff8ee" 
        />
        
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
        
        {/* Earth with textures */}
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

export default R3FGlobeComponent;