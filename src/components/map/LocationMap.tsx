'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Group } from '@/lib/types'

// We'll import and initialize Mapbox only on the client side
let mapboxgl: any
let Map: any
let LngLatBounds: any
let Marker: any
let Popup: any
let NavigationControl: any
let MapboxGeocoder: any

interface LocationMapProps {
  groups: Group[]
}

export default function LocationMap({ groups }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [lng, setLng] = useState(-98.5795)  // Center of US
  const [lat, setLat] = useState(39.8283)   // Center of US
  const [zoom, setZoom] = useState(3)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  
  // Initialize Mapbox only on client-side
  useEffect(() => {
    // Dynamic import of mapbox-gl and geocoder
    const initMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl')
        // Instead of importing the CSS directly, we'll load it dynamically
        const MapboxGecoderModule = await import('@mapbox/mapbox-gl-geocoder')
        
        // Create a style tag to load the Mapbox CSS
        const mapboxStyles = document.createElement('link')
        mapboxStyles.rel = 'stylesheet'
        mapboxStyles.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        document.head.appendChild(mapboxStyles)
        
        // Create a style tag to load the Geocoder CSS
        const geocoderStyles = document.createElement('link')
        geocoderStyles.rel = 'stylesheet'
        geocoderStyles.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.7.0/mapbox-gl-geocoder.css'
        document.head.appendChild(geocoderStyles)
        
        // Set up the mapboxgl variable and classes
        mapboxgl = mapboxModule.default
        Map = mapboxgl.Map
        LngLatBounds = mapboxgl.LngLatBounds
        Marker = mapboxgl.Marker
        Popup = mapboxgl.Popup
        NavigationControl = mapboxgl.NavigationControl
        MapboxGeocoder = MapboxGecoderModule.default
        
        // Set the access token
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
        
        setMapLoaded(true)
      } catch (error) {
        console.error('Error loading Mapbox:', error)
      }
    }
    
    initMapbox()
  }, [])
  
  // Get user location
  useEffect(() => {
    if (mapLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          setUserLocation([longitude, latitude])
        },
        (error) => {
          console.log('Geolocation error or permission denied:', error)
        }
      )
    }
  }, [mapLoaded])
  
  // Initialize map once Mapbox is loaded
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || map.current) return
    
    try {
      // Custom map style for dark theme
      const mapStyle = 'mapbox://styles/mapbox/dark-v10'
      
      map.current = new Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
        boxZoom: true,
        doubleClickZoom: true,
        dragRotate: false,
        dragPan: true,
        keyboard: true,
        pitchWithRotate: false,
        touchZoomRotate: true
      })
      
      // Add navigation control
      map.current.addControl(new NavigationControl(), 'top-right')
      
      // Add geocoder (search) control
      if (MapboxGeocoder) {
        const geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          marker: false,
          placeholder: 'Search for a location',
          proximity: 'ip',
          countries: 'us',
          bbox: [-125.0, 24.0, -66.0, 50.0] // Bounding box for United States
        })
        
        map.current.addControl(geocoder, 'top-left')
      }
      
      // When the map has loaded, fly to user location if available
      map.current.on('load', () => {
        if (userLocation) {
          map.current.flyTo({
            center: userLocation,
            zoom: 9,
            essential: true
          })
        }
      })
      
    } catch (error) {
      console.error('Error initializing map:', error)
    }
    
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapLoaded, lng, lat, zoom, userLocation])
  
  // Add markers when groups data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !groups || groups.length === 0) return
    
    try {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      
      // Create bounds to fit all markers
      const bounds = new LngLatBounds()
      
      groups.forEach((group) => {
        // In a real app, use the actual coordinates from geo_location field
        // For now, generate random coordinates near US center for demonstration
        const randomLng = lng + (Math.random() - 0.5) * 10
        const randomLat = lat + (Math.random() - 0.5) * 10
        
        // Create popup content with custom styling
        const popupElement = document.createElement('div')
        popupElement.className = 'bg-[#292929] text-white rounded-sm shadow-lg overflow-hidden'
        
        const popupContent = `
          <div class="p-3 border-b border-white/10">
            <h3 class="font-medium text-sm">${group.name}</h3>
            <p class="text-xs text-gray-300 mt-1">${[group.city, group.state].filter(Boolean).join(', ')}</p>
          </div>
          <div class="p-3">
            <p class="text-xs text-gray-300">${group.description ? group.description.substring(0, 100) + '...' : 'No description available.'}</p>
            <div class="mt-2 text-xs flex justify-end">
              <button class="px-2 py-1 bg-blue-600 text-white rounded-sm text-xs" 
                onclick="window.location.href='/messages/${group.id}'">
                Contact
              </button>
            </div>
          </div>
        `
        
        popupElement.innerHTML = popupContent
        
        // Create popup
        const popup = new Popup({ 
          offset: 25,
          closeButton: false,
          maxWidth: '300px',
          className: 'custom-popup'
        }).setDOMContent(popupElement)
        
        // Create marker element with custom styling
        const markerEl = document.createElement('div')
        markerEl.className = 'custom-marker'
        markerEl.style.width = '18px'
        markerEl.style.height = '18px'
        markerEl.style.borderRadius = '50%'
        markerEl.style.backgroundColor = '#3B82F6'
        markerEl.style.border = '2px solid rgba(255, 255, 255, 0.4)'
        markerEl.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.7)'
        
        // Create pulse effect
        const pulseEl = document.createElement('div')
        pulseEl.style.position = 'absolute'
        pulseEl.style.inset = '-8px'
        pulseEl.style.borderRadius = '50%'
        pulseEl.style.border = '2px solid rgba(59, 130, 246, 0.4)'
        pulseEl.style.animation = 'pulse 2s infinite'
        
        // Add pulse animation style
        if (!document.getElementById('marker-pulse-style')) {
          const style = document.createElement('style')
          style.id = 'marker-pulse-style'
          style.textContent = `
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 0.8;
              }
              70% {
                transform: scale(2);
                opacity: 0;
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
          `
          document.head.appendChild(style)
        }
        
        markerEl.appendChild(pulseEl)
        
        // Add marker to map
        const marker = new Marker(markerEl)
          .setLngLat([randomLng, randomLat])
          .setPopup(popup)
          .addTo(map.current)
        
        // Store marker reference for cleanup
        markersRef.current.push(marker)
        
        // Extend bounds
        bounds.extend([randomLng, randomLat])
      })
      
      // Fit map to bounds with padding if we have valid bounds
      if (!bounds.isEmpty() && map.current) {
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 10
        })
      }
    } catch (error) {
      console.error('Error adding markers:', error)
    }
  }, [mapLoaded, groups, lng, lat])
  
  // Add user location marker if available
  useEffect(() => {
    if (!mapLoaded || !map.current || !userLocation) return
    
    try {
      // Create user location marker
      const userMarkerEl = document.createElement('div')
      userMarkerEl.className = 'user-location-marker'
      userMarkerEl.style.width = '20px'
      userMarkerEl.style.height = '20px'
      userMarkerEl.style.borderRadius = '50%'
      userMarkerEl.style.backgroundColor = '#FFFFFF'
      userMarkerEl.style.border = '3px solid #3B82F6'
      userMarkerEl.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.8)'
      
      // Create pulse effect
      const userPulseEl = document.createElement('div')
      userPulseEl.style.position = 'absolute'
      userPulseEl.style.inset = '-10px'
      userPulseEl.style.borderRadius = '50%'
      userPulseEl.style.border = '2px solid rgba(255, 255, 255, 0.6)'
      userPulseEl.style.animation = 'pulse 2s infinite'
      
      userMarkerEl.appendChild(userPulseEl)
      
      // Add user marker to map
      const userMarker = new Marker(userMarkerEl)
        .setLngLat(userLocation)
        .addTo(map.current)
      
      // Store marker reference for cleanup
      markersRef.current.push(userMarker)
      
      // Fly to user location
      map.current.flyTo({
        center: userLocation,
        zoom: 9,
        essential: true
      })
      
    } catch (error) {
      console.error('Error adding user location marker:', error)
    }
  }, [mapLoaded, userLocation])
  
  return (
    <div className="relative w-full h-96 rounded-sm overflow-hidden border border-white/10">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map overlay with instructions */}
      {!groups.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#292929]/70 backdrop-blur-sm">
          <div className="text-center p-6 max-w-md">
            <p className="text-white text-lg mb-4">Use the search to find groups in your area</p>
            <p className="text-gray-300 text-sm">
              You can search by location or allow browser to access your location
            </p>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#292929]">
          <div className="animate-pulse text-gray-400 tracking-wider">Loading map...</div>
        </div>
      )}
    </div>
  )
}