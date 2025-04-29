import { useEffect } from 'react';
import { Viewer as CesiumViewer, Cartesian3, Color, SunLight as CesiumSunLight } from 'cesium';
import { useCesium } from 'resium';

const SunLight = () => {
  const { viewer } = useCesium();

  useEffect(() => {
    if (!viewer) return;

    const scene = viewer.scene;
    scene.light = new CesiumSunLight();
    scene.globe.enableLighting = true;

    // Add null checks for skyAtmosphere
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.hueShift = -0.8;
      scene.skyAtmosphere.saturationShift = 0.2;
      scene.skyAtmosphere.brightnessShift = 0.4;
    }

    scene.backgroundColor = Color.BLACK;

    // Add null check for fxaa
    if (viewer.scene.postProcessStages?.fxaa) {
      viewer.scene.postProcessStages.fxaa.enabled = true;
    }
  }, [viewer]);

  return null;
};

export default SunLight;