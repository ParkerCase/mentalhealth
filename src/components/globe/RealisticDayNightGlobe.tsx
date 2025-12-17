import dynamic from 'next/dynamic';
import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { TextureLoader, Mesh, MeshPhongMaterial, SphereGeometry, DoubleSide, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Color, CylinderGeometry, Group as ThreeGroup, Vector3, MeshBasicMaterial, Vector2 } from 'three';
import type { FormEvent } from 'react';

// Dynamic import for react-globe.gl (client-only)
const Globe = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-[#2a2a2a]">
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
  showTime?: boolean;
  showMarkers?: boolean;
}

// Realistic Earth textures for day/night cycle
const DAY_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg';
const NIGHT_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';
const CLOUDS_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';
const BUMP_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const BACKGROUND_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png';

// Custom shader: Blends night and day images to simulate day/night cycle
const dayNightShader = {
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
    #define PI 3.141592653589793
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    varying vec3 vNormal;
    varying vec2 vUv;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) { // [lng, lat]
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3( // x,y,z
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1, 0, 0,
        0, cos(invLat), -sin(invLat),
        0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0, sin(invLon),
        0, 1, 0,
        -sin(invLon), 0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      gl_FragColor = mix(nightColor, dayColor, blendFactor);
    }
  `
};

// Solar calculator functions
const solar = {
  century: (dt: number) => (new Date(dt).getTime() - new Date('2000-01-01T12:00:00Z').getTime()) / (36525 * 24 * 60 * 60 * 1000),
  equationOfTime: (t: number) => {
    const L0 = 280.46645 + 36000.76983 * t + 0.0003032 * t * t;
    const M = 357.52910 + 35999.05030 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
    const e = 0.016708617 - 0.000042037 * t - 0.0000001236 * t * t;
    const C = (1.914600 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M * Math.PI / 180) +
              (0.019993 - 0.000101 * t) * Math.sin(2 * M * Math.PI / 180) +
              0.000290 * Math.sin(3 * M * Math.PI / 180);
    const Theta = L0 + C;
    const v = M + C;
    const R = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v * Math.PI / 180));
    return (L0 - 0.0057183 - Theta + 0.0000000008 * R * R) * 4;
  },
  declination: (t: number) => {
    const L0 = 280.46645 + 36000.76983 * t + 0.0003032 * t * t;
    const M = 357.52910 + 35999.05030 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
    const e = 0.016708617 - 0.000042037 * t - 0.0000001236 * t * t;
    const C = (1.914600 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M * Math.PI / 180) +
              (0.019993 - 0.000101 * t) * Math.sin(2 * M * Math.PI / 180) +
              0.000290 * Math.sin(3 * M * Math.PI / 180);
    const Theta = L0 + C;
    const epsilon = 23.439 - 0.0000004 * t;
    return Math.asin(Math.sin(epsilon * Math.PI / 180) * Math.sin(Theta * Math.PI / 180)) * 180 / Math.PI;
  }
};

const sunPosAt = (dt: number) => {
  const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
  const t = solar.century(dt);
  const longitude = (day - dt) / 864e5 * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
};

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
  showTime = true,
  showMarkers = false,
}, ref) => {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [globeError, setGlobeError] = useState<string | null>(null);
  const [globeMaterial, setGlobeMaterial] = useState<any>();
  const [currentTime, setCurrentTime] = useState(+new Date());
  
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
      timeoutId = setTimeout(updateDimensions, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  // Time animation
  useEffect(() => {
    const VELOCITY = 1; // minutes per frame
    let animationId: number;
    
    const iterateTime = () => {
      setCurrentTime(prev => prev + VELOCITY * 60 * 1000);
      animationId = requestAnimationFrame(iterateTime);
    };
    
    iterateTime();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Load shader material
  useEffect(() => {
    Promise.all([
      new TextureLoader().loadAsync(DAY_TEXTURE),
      new TextureLoader().loadAsync(NIGHT_TEXTURE)
    ]).then(([dayTexture, nightTexture]) => {
      setGlobeMaterial(new ShaderMaterial({
        uniforms: {
          dayTexture: { value: dayTexture },
          nightTexture: { value: nightTexture },
          sunPosition: { value: new Vector2() },
          globeRotation: { value: new Vector2() }
        },
        vertexShader: dayNightShader.vertexShader,
        fragmentShader: dayNightShader.fragmentShader
      }));
    });
  }, []);

  // Update Sun position
  useEffect(() => {
    if (globeMaterial?.uniforms?.sunPosition) {
      globeMaterial.uniforms.sunPosition.value.set(...sunPosAt(currentTime));
    }
  }, [currentTime, globeMaterial]);

  // Globe ready handler
  const handleGlobeReady = useCallback(() => {
    try {
      if (globeEl.current) {
        // Auto-rotation
        if (autoRotate) {
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().autoRotateSpeed = 0.3;
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

  // Prepare marker data with memoization (only if showMarkers is true)
  type GroupMarker = Group & { lat: number; lng: number; isSelected: boolean };
  const groupMarkers: GroupMarker[] = useMemo(() => {
    if (!showMarkers) return [];
    return groups
      .filter(g => g.geo_location && g.geo_location.coordinates.length === 2)
      .map(g => ({
        ...g,
        lat: g.geo_location!.coordinates[1],
        lng: g.geo_location!.coordinates[0],
        isSelected: selectedGroupId === g.id
      }));
  }, [groups, selectedGroupId, showMarkers]);

  // Marker click handler (only if showMarkers is true)
  const handleMarkerClick = useCallback((point: any, event: MouseEvent, coords: { lat: number; lng: number; altitude: number; }) => {
    if (showMarkers && interactive && onGroupSelect) {
      const marker = groupMarkers.find(m => 
        Math.abs(m.lat - coords.lat) < 0.001 && 
        Math.abs(m.lng - coords.lng) < 0.001
      );
      if (marker) {
        onGroupSelect(marker);
      }
    }
  }, [showMarkers, interactive, onGroupSelect, groupMarkers]);

  // Handle zoom callback
  const handleZoom = useCallback(({ lng, lat }: any) => {
    if (globeMaterial?.uniforms?.globeRotation) {
      globeMaterial.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterial]);

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
      <div className="flex items-center justify-center h-full w-full bg-[#2a2a2a] text-white">
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
        backgroundColor: '#0B1426',
        ...style 
      }}
    >
      {/* Globe component with shader-based day/night cycle */}
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
          globeMaterial={globeMaterial}
          backgroundImageUrl={BACKGROUND_TEXTURE}
          {...(showMarkers && {
            pointsData: groupMarkers,
            pointLat: (d: any) => d.lat,
            pointLng: (d: any) => d.lng,
            pointAltitude: 0.02,
            pointRadius: 1.0,
            pointColor: (d: any) => d.isSelected ? '#FFD700' : '#FF6B47',
            onPointClick: handleMarkerClick
          })}
          onGlobeReady={handleGlobeReady}
          onZoom={handleZoom}
          enablePointerInteraction={interactive}
        />
      </div>
      
      {/* Time display */}
      {showTime && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          color: 'lightblue',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {new Date(currentTime).toLocaleString()}
        </div>
      )}
      
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
    </div>
  );
});

RealisticDayNightGlobe.displayName = 'RealisticDayNightGlobe';

export default RealisticDayNightGlobe;
