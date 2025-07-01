### day-night-cycle (I hate this globe but like the day to night example and like the city lights when it is at night)

<head>
  <style>
    body { margin: 0; }

    #time {
      position: absolute;
      bottom: 8px;
      left: 8px;
      color: lightblue;
      font-family: monospace;
    }

  </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../dist/react-globe.gl.js" defer></script>-->
</head>

<body>
<div id="globeViz"></div>

<script src="//unpkg.com/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import Globe from 'https://esm.sh/react-globe.gl?external=react';
  import React, { useState, useEffect, useCallback } from 'react';
  import { createRoot } from 'react-dom';
  import { TextureLoader, ShaderMaterial, Vector2 } from 'https://esm.sh/three';
  import * as solar from 'https://esm.sh/solar-calculator';

  const VELOCITY = 1; // minutes per frame

  // Custom shader:  Blends night and day images to simulate day/night cycle
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

  const sunPosAt = dt => {
    const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
    const t = solar.century(dt);
    const longitude = (day - dt) / 864e5 * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  };

  const World = () => {
    const [dt, setDt] = useState(+new Date());
    const [globeMaterial, setGlobeMaterial] = useState();

    useEffect(() => {
      (function iterateTime() {
        setDt(dt => dt + VELOCITY * 60 * 1000);
        requestAnimationFrame(iterateTime);
      })();
    }, []);

    useEffect(() => {
      Promise.all([
        new TextureLoader().loadAsync('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg'),
        new TextureLoader().loadAsync('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
      ]).then(([dayTexture, nightTexture]) => {
        setGlobeMaterial(new ShaderMaterial({
          uniforms: {
            dayTexture: {value: dayTexture},
            nightTexture: {value: nightTexture},
            sunPosition: {value: new Vector2()},
            globeRotation: {value: new Vector2()}
          },
          vertexShader: dayNightShader.vertexShader,
          fragmentShader: dayNightShader.fragmentShader
        }));
      });
    }, []);

    useEffect(() => {
      // Update Sun position
      globeMaterial?.uniforms.sunPosition.value.set(...sunPosAt(dt));
    }, [dt, globeMaterial]);

    return <div>
      <Globe
        globeMaterial={globeMaterial}
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        // Update globe rotation on shader
        onZoom={useCallback(({ lng, lat }) => globeMaterial?.uniforms.globeRotation.value.set(lng, lat), [globeMaterial])}
      />
      <div id="time">{new Date(dt).toLocaleString()}</div>
    </div>;
  };

  createRoot(document.getElementById('globeViz'))
    .render(<World />);
</script>
</body>

### world population (would like for this to be representative to groups and the amount of groups in each area rather than world population)

<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../dist/react-globe.gl.js" defer></script>-->
</head>

<body>
<div id="globeViz"></div>

<script src="//unpkg.com/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import Globe from 'https://esm.sh/react-globe.gl?external=react';
  import React, { useState, useEffect, useRef } from 'react';
  import { createRoot } from 'react-dom';
  import { csvParse } from 'https://esm.sh/d3-dsv';
  import { scaleSequentialSqrt } from 'https://esm.sh/d3-scale';
  import { interpolateYlOrRd } from 'https://esm.sh/d3-scale-chromatic';

  const World = () => {
    const globeEl = useRef();
    const [popData, setPopData] = useState([]);

    useEffect(() => {
      // load data
      fetch('../datasets/world_population.csv').then(res => res.text())
        .then(csv => csvParse(csv, ({ lat, lng, pop }) => ({ lat: +lat, lng: +lng, pop: +pop })))
        .then(setPopData);
    }, []);

    useEffect(() => {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.1;
    }, []);

    const weightColor = scaleSequentialSqrt(interpolateYlOrRd)
      .domain([0, 1e7]);

    return <Globe
      ref={globeEl}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
      bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"

      hexBinPointsData={popData}
      hexBinPointWeight="pop"
      hexAltitude={d => d.sumWeight * 6e-8}
      hexBinResolution={4}
      hexTopColor={d => weightColor(d.sumWeight)}
      hexSideColor={d => weightColor(d.sumWeight)}
      hexBinMerge={true}
      enablePointerInteraction={false}
    />;
  };

  createRoot(document.getElementById('globeViz'))
    .render(<World />);
</script>
</body>

### Clouds

<head>
  <style> body { margin: 0; } </style>

  <script type="importmap">{ "imports": {
    "react": "https://esm.sh/react",
    "react-dom": "https://esm.sh/react-dom/client"
  }}</script>

<!--  <script type="module">import * as React from 'react'; window.React = React;</script>-->
<!--  <script src="../../dist/react-globe.gl.js" defer></script>-->
</head>

<body>
<div id="globeViz"></div>

<script src="//unpkg.com/@babel/standalone"></script>
<script type="text/jsx" data-type="module">
  import Globe from 'https://esm.sh/react-globe.gl?external=react';
  import React, { useEffect, useRef } from 'react';
  import { createRoot } from 'react-dom';
  import * as THREE from 'https://esm.sh/three';

  const World = () => {
    const globeEl = useRef();

    useEffect(() => {
      const globe = globeEl.current;

      // Auto-rotate
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.35;

      // Add clouds sphere
      const CLOUDS_IMG_URL = './clouds.png'; // from https://github.com/turban/webgl-earth
      const CLOUDS_ALT = 0.004;
      const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

      new THREE.TextureLoader().load(CLOUDS_IMG_URL, cloudsTexture => {
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
          new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true })
        );
        globe.scene().add(clouds);

        (function rotateClouds() {
          clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
          requestAnimationFrame(rotateClouds);
        })();
      });
    }, []);

    return <Globe
      ref={globeEl}
      animateIn={false}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
    />;
  };

  createRoot(document.getElementById('globeViz'))
    .render(<World />);
</script>
</body>
