'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Entity, EllipseGraphics } from 'resium';
import * as Cesium from 'cesium';

const AuroraEntity: React.FC = () => {
  // Position auroras at the poles
  const northPole = Cesium.Cartesian3.fromDegrees(0, 85, 300000.0);
  const southPole = Cesium.Cartesian3.fromDegrees(0, -85, 300000.0);

  // State for animation
  const [northRotation, setNorthRotation] = useState(Math.random() * Math.PI);
  const [southRotation, setSouthRotation] = useState(Math.random() * Math.PI);
  const [northPulse, setNorthPulse] = useState(0.4);
  const [southPulse, setSouthPulse] = useState(0.3);
  
  // Reference for animation frame
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Animate rotation and pulsing effect for auroras
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;
      
      // Update rotations - different speeds for more organic look
      setNorthRotation(prev => (prev + 0.05 * deltaTime) % (2 * Math.PI));
      setSouthRotation(prev => (prev - 0.03 * deltaTime) % (2 * Math.PI));
      
      // Pulse effect - oscillate alpha values for shimmering
      setNorthPulse(prev => {
        const oscillation = Math.sin(now * 0.001) * 0.1;
        return 0.4 + oscillation;
      });
      
      setSouthPulse(prev => {
        // Slightly different oscillation for south pole
        const oscillation = Math.sin(now * 0.0008) * 0.08;
        return 0.3 + oscillation;
      });
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Create multiple aurora rings for more complex effect
  const createAuroraRings = (isNorth: boolean) => {
    const rings = [];
    const baseSize = isNorth ? 900000.0 : 800000.0;
    const basePulse = isNorth ? northPulse : southPulse;
    const baseRotation = isNorth ? northRotation : southRotation;
    const baseColor = isNorth ? Cesium.Color.LIME : Cesium.Color.CYAN;
    
    // Create 3 rings with different sizes and slightly different properties
    for (let i = 0; i < 3; i++) {
      const sizeFactor = 1 - (i * 0.15);
      const alphaMod = 1 - (i * 0.2);
      const rotationOffset = i * (Math.PI / 6);
      
      rings.push(
        <EllipseGraphics
          key={`${isNorth ? 'north' : 'south'}-ring-${i}`}
          semiMajorAxis={baseSize * sizeFactor}
          semiMinorAxis={baseSize * sizeFactor * 0.7}
          material={baseColor.withAlpha(basePulse * alphaMod)}
          height={300000 - (i * 30000)}
          rotation={baseRotation + rotationOffset}
          stRotation={baseRotation - rotationOffset}
          outline={false}
        />
      );
    }
    
    return rings;
  };

  return (
    <>
      {/* Northern Aurora */}
      <Entity position={northPole}>
        {createAuroraRings(true)}
      </Entity>

      {/* Southern Aurora */}
      <Entity position={southPole}>
        {createAuroraRings(false)}
      </Entity>
    </>
  );
};

export default AuroraEntity;