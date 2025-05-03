'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Viewer, ImageryLayer } from 'resium';
import * as Cesium from 'cesium';
import CameraController from './CameraController';
import GlobeControls from './GlobeControls';
import GroupMarkers from './GroupMarkers';
import { Cartesian3 } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface GlobeProps {
  height?: string;
  width?: string;
  autoRotate?: boolean;
  initialCoordinates?: { lat: number; lng: number };
  groups?: {
    id: string;
    name: string;
    geo_location: { coordinates: [number, number] };
    city?: string;
    state?: string;
  }[];
  selectedGroupId?: string;
  onGroupSelect?: (group: any) => void;
}

const RealisticGlobe: React.FC<GlobeProps> = ({
  height = '100vh',
  width = '100%',
  autoRotate = true,
  initialCoordinates = { lat: 0, lng: 0 },
  groups = [],
  selectedGroupId,
  onGroupSelect,
}) => {
  const [imageryProvider, setImageryProvider] = useState<Cesium.ImageryProvider | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  const loadCesiumAssets = useCallback(() => {
    Cesium.createWorldImageryAsync({
      style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS, // This is public
    }).then((imagery) => {
      setImageryProvider(imagery);
      if (viewerRef.current) {
        viewerRef.current.scene.requestRender();
      }
    }).catch((error) => {
      console.error('Failed to load Cesium Ion imagery. Falling back to OpenStreetMap.', error);
      const fallback = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      });
      setImageryProvider(fallback);
      if (viewerRef.current) {
        viewerRef.current.scene.requestRender();
      }
    });
  }, []);
  
  const handleViewerMount = (viewer: Cesium.Viewer) => {
    viewerRef.current = viewer;

    if (!viewer || viewer.isDestroyed()) return;

    const scene = viewer.scene;
    const globe = scene.globe;

    globe.show = true;
    globe.baseColor = Cesium.Color.DARKGRAY;
    globe.enableLighting = true;
    globe.depthTestAgainstTerrain = false;

    scene.backgroundColor = Cesium.Color.BLACK;

    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.hueShift = 0.0;
      scene.skyAtmosphere.saturationShift = 0.1;
      scene.skyAtmosphere.brightnessShift = 0.1;
    }

    if (scene.sun) scene.sun.show = true;
    if (scene.skyBox) scene.skyBox.show = true;

    if (scene.postProcessStages?.fxaa) {
      scene.postProcessStages.fxaa.enabled = true;
    }

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
    });

    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.shouldAnimate = true;

    if (viewer.shadowMap) {
      viewer.shadowMap.enabled = true;
      viewer.shadowMap.softShadows = true;
    }

    console.log('Globe is shown?', globe?.show);
    console.log('Imagery provider loaded:', !!imageryProvider);
  };

  useEffect(() => {
    Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN!;
    loadCesiumAssets();
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying viewer:', e);
        }
      }
    };
  }, [loadCesiumAssets]);

  return (
    <div className="relative" style={{ height, width }}>
      <Viewer
        ref={(ref: any) => {
          if (ref?.cesiumElement) {
            handleViewerMount(ref.cesiumElement);
          }
        }}
        full
        useDefaultRenderLoop={true}
        terrainProvider={new Cesium.EllipsoidTerrainProvider()}
        baseLayerPicker={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        homeButton={false}
        geocoder={false}
        fullscreenButton={false}
        animation={false}
        timeline={false}
        vrButton={false}
        infoBox={false}
        selectionIndicator={false}
        style={{ width: '100%', height: '100%' }}
      >
        {imageryProvider && <ImageryLayer imageryProvider={imageryProvider} />}

        {autoRotate && (
          <CameraController
            mode="rotate"
            enabled={true}
            rotateOptions={{ speed: 0.02, altitude: 15000000 }}
          />
        )}

        <GlobeControls
          enabledTools={['search', 'home', 'locate', 'settings']}
          onFlyTo={(lat, lng) => {
            if (viewerRef.current) {
              viewerRef.current.camera.flyTo({
                destination: Cartesian3.fromDegrees(lng, lat, 1000000),
                duration: 2,
              });
            }
          }}
        />

        <GroupMarkers
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
        />
      </Viewer>
    </div>
  );
};

export default RealisticGlobe;