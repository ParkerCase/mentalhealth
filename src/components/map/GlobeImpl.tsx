'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [textures, setTextures] = useState<THREE.Texture[]>([])
  const [loaded, setLoaded] = useState(false)
  
  // Load textures with error handling
  useEffect(() => {
    try {
      const textureLoader = new THREE.TextureLoader()
      const textureUrls = [
        '/earth-map.jpg',
        '/earth-normal-map.jpg',
        '/earth-specular-map.jpg',
        '/earth-clouds.png'
      ]
      
      Promise.all(
        textureUrls.map(url => 
          new Promise<THREE.Texture | null>((resolve) => {
            textureLoader.load(
              url, 
              (texture) => resolve(texture),
              undefined,
              (err) => {
                console.error(`Failed to load texture: ${url}`, err)
                resolve(null)
              }
            )
          })
        )
      ).then(loadedTextures => {
        const validTextures = loadedTextures.filter(Boolean) as THREE.Texture[]
        setTextures(validTextures)
        if (validTextures.length === textureUrls.length) {
          setLoaded(true)
        }
      })
    } catch (error) {
      console.error("Error loading textures:", error)
    }
  }, [])
  
  // Add some random points for cities/points of interest
  const [cities] = useState(() => {
    const points = []
    for (let i = 0; i < 20; i++) {
      const lat = Math.random() * 180 - 90
      const lng = Math.random() * 360 - 180
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      
      const x = -(Math.sin(phi) * Math.cos(theta)) * 1.01
      const y = Math.cos(phi) * 1.01
      const z = Math.sin(phi) * Math.sin(theta) * 1.01
      
      points.push({ position: [x, y, z] })
    }
    return points
  })
  
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.07
    }
  })
  
  if (!loaded || textures.length !== 4) {
    return null
  }
  
  const [earthMap, earthNormalMap, earthSpecularMap, earthCloudsMap] = textures
  
  return (
    <>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={earthMap}
          normalMap={earthNormalMap}
          specularMap={earthSpecularMap}
          shininess={5}
        />
      </mesh>
      
      {/* Clouds */}
      <mesh ref={cloudsRef} scale={1.003}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={earthCloudsMap}
          transparent={true}
          opacity={0.4}
        />
      </mesh>
      
      {/* City points */}
      {cities.map((city, index) => (
        <mesh key={index} position={city.position as [number, number, number]}>
          <sphereGeometry args={[0.005, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </>
  )
}

export default function GlobeImpl() {
  const [mounted, setMounted] = useState(false)
  
  // Only render on client-side
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <Earth />
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        rotateSpeed={0.5}
      />
    </Canvas>
  )
}