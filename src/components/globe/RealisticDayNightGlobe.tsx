import dynamic from 'next/dynamic';
import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { TextureLoader, Mesh, MeshPhongMaterial, SphereGeometry, DoubleSide, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Color, CylinderGeometry, Group as ThreeGroup, Vector3, MeshBasicMaterial } from 'three';
import type { FormEvent } from 'react';

// Dynamic import for react-globe.gl (client-only)
const Globe = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-[#292929]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Loading Interactive Globe...</p>
      </div>
    </div>
  )
});

// Types for group data
export interface Group {
  id: string;
  name: string;
  geo_location?: {
    type?: string;
    coordinates: number[]; // [lng, lat]
  };
  city?: string;
  state?: string;
}

// Add HexBinPoint type
interface HexBinPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface RealisticDayNightGlobeProps {
  groups?: Group[];
  selectedGroupId?: string;
  onGroupSelect?: (group: Group) => void;
  initialCoordinates?: { lat: number; lng: number };
  autoRotate?: boolean;
  interactive?: boolean;
  showSearch?: boolean;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  showAtmosphereBackground?: boolean;
  onSearch?: () => void;
  searchBarStyle?: React.CSSProperties;
  globeScale?: number;
}

const DAY_TEXTURE = '/assets/earth-map.jpg';
const NIGHT_TEXTURE = '/assets/earth-night.jpg';
const CLOUDS_TEXTURE = '/assets/earth-clouds.png';
const BUMP_TEXTURE = '/assets/earth-normal-map.jpg';
const SPECULAR_TEXTURE = '/assets/earth-specular-map.jpg';

// Optimized major cities - reduced to key global cities only
const MAJOR_CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219 }
];

const RealisticDayNightGlobe = forwardRef<any, RealisticDayNightGlobeProps>(({
  groups = [],
  selectedGroupId,
  onGroupSelect,
  initialCoordinates = { lat: 20, lng: 0 },
  autoRotate = true,
  interactive = false,
  showSearch = false,
  style = {},
  width = '100%',
  height = '100%',
  showAtmosphereBackground = true,
  onSearch,
  searchBarStyle,
  globeScale = 1.0,
}, ref) => {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [globeError, setGlobeError] = useState<string | null>(null);
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Responsive sizing with throttling
  const updateDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: typeof width === 'number' ? width : window.innerWidth,
        height: typeof height === 'number' ? height : window.innerHeight
      });
    }
  }, [width, height]);

  useEffect(() => {
    updateDimensions();
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100); // Throttle resize events
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  // Globe ready handler
  const handleGlobeReady = useCallback(() => {
    try {
      if (globeEl.current) {
        // Auto-rotation
        if (autoRotate) {
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().autoRotateSpeed = 0.5;
        }
        
        // Fly to initial coordinates
        if (initialCoordinates) {
          globeEl.current.pointOfView({ 
            lat: initialCoordinates.lat, 
            lng: initialCoordinates.lng, 
            altitude: 2.5 
          }, 1000);
        }
        
        setIsGlobeReady(true);
      }
    } catch (error) {
      console.error('Globe initialization error:', error);
      setGlobeError('Failed to initialize globe');
    }
  }, [autoRotate, initialCoordinates]);

  // Prepare marker data with memoization
  type GroupMarker = Group & { lat: number; lng: number; isSelected: boolean };
  const groupMarkers: GroupMarker[] = useMemo(() => {
    return groups
      .filter(g => g.geo_location && g.geo_location.coordinates.length === 2)
      .map(g => ({
        ...g,
        lat: g.geo_location!.coordinates[1],
        lng: g.geo_location!.coordinates[0],
        isSelected: selectedGroupId === g.id
      }));
  }, [groups, selectedGroupId]);

  // Optimized hex points with memoization
  const hexPoints = useMemo(() => {
    return [
      ...MAJOR_CITIES.map(city => ({
        lat: city.lat,
        lng: city.lng,
        weight: 2, // Reduced weight for better performance
        isMajor: true
      })),
      ...groupMarkers.map(g => ({
        lat: g.lat,
        lng: g.lng,
        weight: 6, // Groups have more impact
        isMajor: false
      }))
    ];
  }, [groupMarkers]);

  // Marker click handler
  const handleMarkerClick = useCallback((marker: GroupMarker) => {
    if (interactive && onGroupSelect) {
      onGroupSelect(marker);
    }
  }, [interactive, onGroupSelect]);

  // Optimized search with debouncing
  const handleSearch = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (globeEl.current) {
          globeEl.current.pointOfView({ 
            lat: parseFloat(lat), 
            lng: parseFloat(lon), 
            altitude: 2.5 
          }, 1200);
        }
        if (onSearch) onSearch();
      } else {
        setSearchError('Location not found.');
      }
    } catch (err) {
      setSearchError('Error searching location.');
    } finally {
      setSearchLoading(false);
    }
  }, [searchValue, onSearch]);

  // Optimized atmosphere background
  const BackgroundAtmosphereCanvas = React.memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      let animationId: number;
      
      const draw = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const w = Math.min(window.innerWidth, 1920); // Cap at 1920px for performance
        const h = Math.min(window.innerHeight, 1080); // Cap at 1080px for performance
        
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        
        ctx.clearRect(0, 0, w, h);
        
        // Simplified gradient for better performance
        const cx = w / 2;
        const cy = h / 2.1;
        const radius = Math.min(w, h) * 0.44;
        
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
        grad.addColorStop(0, 'rgba(58,108,255,0.35)');
        grad.addColorStop(0.7, 'rgba(58,108,255,0.15)');
        grad.addColorStop(1, 'rgba(255,224,102,0.1)');
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      };
      
      draw();
      
      const handleResize = () => {
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(draw);
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
      };
    }, []);
    
    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          display: 'block',
        }}
      />
    );
  });

  BackgroundAtmosphereCanvas.displayName = 'BackgroundAtmosphereCanvas';

  // Expose pointOfView to parent via ref
  useImperativeHandle(ref, () => ({
    pointOfView: (...args: any[]) => {
      if (globeEl.current && isGlobeReady) {
        return globeEl.current.pointOfView?.(...args);
      }
    }
  }), [isGlobeReady]);

  // Error boundary fallback
  if (globeError) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#292929] text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load globe visualization</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        transform: `scale(${globeScale})`, 
        transformOrigin: 'center',
        ...style 
      }}
    >
      {/* Blue-to-orange glow background overlay */}
      {showAtmosphereBackground && <BackgroundAtmosphereCanvas />}
      
      {/* Globe component */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: interactive ? 'auto' : 'none',
      }}>
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={NIGHT_TEXTURE}
          bumpImageUrl={BUMP_TEXTURE}
          hexBinPointsData={hexPoints}
          hexBinPointLat={(d: any) => d.lat}
          hexBinPointLng={(d: any) => d.lng}
          hexBinResolution={4} // Reduced for better performance
          hexBinMerge={true}
          pointsData={groupMarkers}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointAltitude={0.01}
          pointRadius={0.5}
          pointColor={(d: any) => d.isSelected ? '#FFD700' : '#FF6B47'}
          onPointClick={handleMarkerClick}
          atmosphereColor="#FFD9A0"
          atmosphereAltitude={0.15}
          onGlobeReady={handleGlobeReady}
          enablePointerInteraction={interactive}
        />
      </div>
      
      {/* Search functionality */}
      {showSearch && (
        <form 
          onSubmit={handleSearch} 
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm"
          style={searchBarStyle}
        >
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search for a city or place..."
            className="px-3 py-2 rounded border-none outline-none min-w-[220px] text-gray-900"
            disabled={searchLoading}
          />
          <button 
            type="submit" 
            disabled={searchLoading || !searchValue.trim()} 
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {searchLoading ? 'Searching...' : 'Go'}
          </button>
          {searchError && (
            <span className="text-red-400 text-sm ml-2">{searchError}</span>
          )}
        </form>
      )}
      
      {/* Optimized CSS for hex bin colors */}
      <style jsx>{`
        :global(.globe-hexbin-hex) {
          transition: fill 0.3s ease !important;
        }
        :global(.globe-hexbin-hex:nth-child(4n+1)) { 
          fill: #ffe066 !important; 
          stroke: #ffe066 !important; 
        }
        :global(.globe-hexbin-hex:nth-child(4n+2)) { 
          fill: #ffb347 !important; 
          stroke: #ffb347 !important; 
        }
        :global(.globe-hexbin-hex:nth-child(4n+3)) { 
          fill: #ff7f11 !important; 
          stroke: #ff7f11 !important; 
        }
        :global(.globe-hexbin-hex:nth-child(4n+4)) { 
          fill: #ff2d00 !important; 
          stroke: #ff2d00 !important; 
        }
      `}</style>
    </div>
  );
});

RealisticDayNightGlobe.displayName = 'RealisticDayNightGlobe';

export default RealisticDayNightGlobe;
