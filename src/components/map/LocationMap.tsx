// src/components/map/LocationMap.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Initialize Mapbox with public token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function LocationMap({ groups }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [lng, setLng] = useState(-98.5795)  // Center of US
  const [lat, setLat] = useState(39.8283)   // Center of US
  const [zoom, setZoom] = useState(3)
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
    })
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    
    // Get user location if permitted
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 9,
          essential: true
        })
      },
      (error) => {
        console.log('Geolocation error or permission denied:', error)
      }
    )
    
    return () => map.current?.remove()
  }, [lng, lat, zoom])
  
  // Add markers when groups data changes
  useEffect(() => {
    if (!map.current || !groups || groups.length === 0) return
    
    // Remove existing markers if any
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker')
    existingMarkers.forEach((marker) => marker.remove())
    
    // Convert addresses to coordinates (in a real app, you'd use your geocoded data)
    // For this example, we'll use basic geocoding
    
    // Create bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds()
    
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
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent)
      
      // Create marker element
      const markerEl = document.createElement('div')
      markerEl.className = 'custom-marker'
      markerEl.style.width = '24px'
      markerEl.style.height = '24px'
      markerEl.style.backgroundImage = 'url(/marker-icon.png)'
      markerEl.style.backgroundSize = 'cover'
      
      // Add marker
      new mapboxgl.Marker(markerEl)
        .setLngLat([randomLng, randomLat])
        .setPopup(popup)
        .addTo(map.current)
      
      // Extend bounds
      bounds.extend([randomLng, randomLat])
    })
    
    // Fit map to bounds with padding
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10
      })
    }
  }, [groups, lng, lat])
  
  return (
    <div ref={mapContainer} className="w-full h-96 rounded-md" />
  )
}