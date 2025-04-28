'use client';

import { Entity, EllipseGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { useEffect, useState } from 'react';

const AuroraEntity = () => {
  const northPole = Cartesian3.fromDegrees(0, 85, 300000.0);
  const southPole = Cartesian3.fromDegrees(0, -85, 300000.0);

  const [northRotation, setNorthRotation] = useState(Math.random() * Math.PI);
  const [southRotation, setSouthRotation] = useState(Math.random() * Math.PI);

  useEffect(() => {
    const interval = setInterval(() => {
      setNorthRotation(prev => prev + 0.002);
      setSouthRotation(prev => prev - 0.002);
    }, 50); // Update every 50ms for smoothness

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Northern Aurora */}
      <Entity position={northPole}>
        <EllipseGraphics
          semiMajorAxis={500000.0}
          semiMinorAxis={300000.0}
          material={Color.LIME.withAlpha(0.4)}
          rotation={northRotation}
          stRotation={northRotation}
        />
      </Entity>

      {/* Southern Aurora */}
      <Entity position={southPole}>
        <EllipseGraphics
          semiMajorAxis={500000.0}
          semiMinorAxis={300000.0}
          material={Color.CYAN.withAlpha(0.4)}
          rotation={southRotation}
          stRotation={southRotation}
        />
      </Entity>
    </>
  );
};

export default AuroraEntity;