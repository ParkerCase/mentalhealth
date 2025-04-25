// src/components/map/Globe.tsx
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function Globe() {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 2.5
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    
    // Globe geometry
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64)
    
    // Earth texture
    const textureLoader = new THREE.TextureLoader()
    const earthTexture = textureLoader.load('/earth-blue-marble.jpg')
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
    })
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial)
    scene.add(earth)
    
    // Atmosphere effect (optional)
    const atmosphereGeometry = new THREE.SphereGeometry(1.01, 64, 64)
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    scene.add(atmosphere)
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 3, 5)
    scene.add(pointLight)
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.enableZoom = false
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      earth.rotation.y += 0.001
      controls.update()
      renderer.render(scene, camera)
    }
    
    animate()
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return <div ref={containerRef} className="w-full h-full"></div>
}