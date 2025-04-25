// src/components/map/LocationMap.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Group } from '@/lib/types'

// We'll import and initialize Mapbox only on the client side
let mapboxgl: any
let Map: any
let LngLatBounds: any
let Marker: any
let Popup: any
let NavigationControl: any

interface LocationMapProps {
  groups: Group[]
}

export default function LocationMap({ groups }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [lng, setLng] = useState(-98.5795)  // Center of US
  const [lat, setLat] = useState(39.8283)   // Center of US
  const [zoom, setZoom] = useState(3)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Initialize Mapbox only on client-side
  useEffect(() => {
    // Dynamic import of mapbox-gl
    const initMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl')
        await import('mapbox-gl/dist/mapbox-gl.css')
        
        // Set up the mapboxgl variable and classes
        mapboxgl = mapboxModule.default
        Map = mapboxgl.Map
        LngLatBounds = mapboxgl.LngLatBounds
        Marker = mapboxgl.Marker
        Popup = mapboxgl.Popup
        NavigationControl = mapboxgl.NavigationControl
        
        // Set the access token
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
        
        setMapLoaded(true)
      } catch (error) {
        console.error('Error loading Mapbox:', error)
      }
    }
    
    initMapbox()
  }, [])
  
  // Initialize map once Mapbox is loaded
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || map.current) return
    
    try {
      map.current = new Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lng, lat],
        zoom: zoom,
      })
      
      map.current.addControl(new NavigationControl(), 'top-right')
      
      // Get user location if permitted
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords
            if (map.current) {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: 9,
                essential: true
              })
            }
          },
          (error) => {
            console.log('Geolocation error or permission denied:', error)
          }
        )
      }
    } catch (error) {
      console.error('Error initializing map:', error)
    }
    
    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapLoaded, lng, lat, zoom])
  
  // Add markers when groups data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !groups || groups.length === 0) return
    
    try {
      // Remove existing markers if any
      const existingMarkers = document.querySelectorAll('.mapboxgl-marker')
      existingMarkers.forEach((marker) => marker.remove())
      
      // Create bounds to fit all markers
      const bounds = new LngLatBounds()
      
      groups.forEach((group) => {
        // In a real app, you'd use the actual coordinates from your geo_location field
        // For now, we'll generate some random coordinates near the US center for demonstration
        const randomLng = lng + (Math.random() - 0.5) * 10
        const randomLat = lat + (Math.random() - 0.5) * 10
        
        // Create popup content
        const popupContent = document.createElement('div')
        popupContent.innerHTML = `
          <h3 class="font-semibold">${group.name}</h3>
          <p class="text-sm">${[group.city, group.state].filter(Boolean).join(', ')}</p>
        `
        
        // Create popup
        const popup = new Popup({ offset: 25 })
          .setDOMContent(popupContent)
        
        // Create marker element
        const markerEl = document.createElement('div')
        markerEl.className = 'custom-marker'
        markerEl.style.width = '24px'
        markerEl.style.height = '24px'
        markerEl.style.backgroundImage = 'url(/marker-icon.png)'
        markerEl.style.backgroundSize = 'cover'
        
        // Add marker if map exists
        if (map.current) {
          new Marker(markerEl)
            .setLngLat([randomLng, randomLat])
            .setPopup(popup)
            .addTo(map.current)
        }
        
        // Extend bounds
        bounds.extend([randomLng, randomLat])
      })
      
      // Fit map to bounds with padding
      if (bounds.isEmpty() === false && map.current) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 10
        });
      }
    } catch (error) {
      console.error('Error adding markers:', error)
    }
  }, [mapLoaded, groups, lng, lat])
  
  return (
    <div ref={mapContainer} className="w-full h-96 rounded-md" />
  )
}