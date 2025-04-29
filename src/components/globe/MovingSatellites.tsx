'use client';

import { useEffect, useState } from 'react';
import { Entity } from 'resium';
import * as Cesium from 'cesium';

// Pre-defined satellite paths
const SATELLITE_ORBITS = [
  {
    name: 'Satellite A',
    semiMajorAxis: 7000000, // meters
    inclination: 0.5,      // radians
    period: 90,            // minutes
    color: Cesium.Color.RED
  },
  {
    name: 'Satellite B',
    semiMajorAxis: 8000000,
    inclination: 0.8,
    period: 120,
    color: Cesium.Color.BLUE
  },
  {
    name: 'Satellite C',
    semiMajorAxis: 9000000,
    inclination: 0.3,
    period: 180,
    color: Cesium.Color.GREEN
  }
];

interface MovingSatellitesProps {
  count?: number;
  showLabels?: boolean;
  showPaths?: boolean;
}

/**
 * Component that adds moving satellites around the Earth
 */
const MovingSatellites: React.FC<MovingSatellitesProps> = ({
  count = 3,
  showLabels = true,
  showPaths = true
}) => {
  // Use constant-time property for consistent animation
  const [startTime] = useState(() => Cesium.JulianDate.fromDate(new Date()));

  // Create position functions for each satellite
  const createSatellitePositionFunction = (orbit: typeof SATELLITE_ORBITS[0]) => {
    return new Cesium.CallbackProperty((time) => {
      if (!time) return new Cesium.Cartesian3(); // Early return if time is undefined
      
      // Calculate the time difference in minutes
      let timeDifference = 0;
      try {
        timeDifference = Cesium.JulianDate.secondsDifference(time, startTime) / 60;
      } catch (e) {
        // Fallback if JulianDate operations fail
        timeDifference = (Date.now() / 1000) / 60;
      }
      
      // Calculate the angle based on the period
      const angle = (2 * Math.PI * (timeDifference % orbit.period)) / orbit.period;
      
      // Calculate the position in elliptical orbit
      const x = orbit.semiMajorAxis * Math.cos(angle);
      const z = orbit.semiMajorAxis * Math.sin(angle) * Math.sin(orbit.inclination);
      const y = orbit.semiMajorAxis * Math.sin(angle) * Math.cos(orbit.inclination);
      
      return new Cesium.Cartesian3(x, y, z);
    }, false);
  };

  // Generate complete orbit paths
  const createOrbitPath = (orbit: typeof SATELLITE_ORBITS[0]) => {
    const positions = [];
    const orbitPoints = 100; // Number of points in the orbit path
    
    for (let i = 0; i < orbitPoints; i++) {
      const angle = (i / orbitPoints) * 2 * Math.PI;
      const x = orbit.semiMajorAxis * Math.cos(angle);
      const z = orbit.semiMajorAxis * Math.sin(angle) * Math.sin(orbit.inclination);
      const y = orbit.semiMajorAxis * Math.sin(angle) * Math.cos(orbit.inclination);
      
      positions.push(new Cesium.Cartesian3(x, y, z));
    }
    
    // Close the loop
    positions.push(positions[0]);
    
    return positions;
  };

  // Limit to requested count
  const orbitsToUse = SATELLITE_ORBITS.slice(0, count);

  return (
    <>
      {/* Add satellites */}
      {orbitsToUse.map((orbit, index) => (
        <Entity 
          key={`satellite-${index}`}
          name={orbit.name}
          position={createSatellitePositionFunction(orbit)}
          point={{
            pixelSize: 10,
            color: orbit.color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          }}
          label={{
            text: orbit.name,
            font: '12px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            show: showLabels
          }}
        />
      ))}

      {/* Add orbit paths */}
      {showPaths && orbitsToUse.map((orbit, index) => (
        <Entity
          key={`orbit-${index}`}
          polyline={{
            positions: createOrbitPath(orbit),
            width: 1,
            material: orbit.color.withAlpha(0.5)
          }}
        />
      ))}
    </>
  );
};

export default MovingSatellites;