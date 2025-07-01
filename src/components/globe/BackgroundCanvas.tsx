import React, { useRef, useEffect } from 'react';

const BackgroundCanvas: React.FC = () => {
  const starfieldRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = starfieldRef.current;
    if (!canvas) return;
    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate stars
    const STAR_COUNT = Math.floor((width * height) / 1200);
    const stars = Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.7,
      baseAlpha: 0.5 + Math.random() * 0.5,
      twinkleSpeed: 0.5 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2
    }));

    // Sun properties (horizontal elliptical glow at the top)
    const sun = {
      x: width / 2,
      y: height * 0.04,
      rx: width * 0.45,
      ry: height * 0.18,
      baseAlpha: 0.85,
      flickerSpeed: 0.7,
      flickerPhase: Math.random() * Math.PI * 2
    };

    function drawScene(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw sun elliptical glow (flickering)
      const flicker = Math.sin(time * 0.001 * sun.flickerSpeed + sun.flickerPhase) * 0.08 + 1;
      const sunAlpha = sun.baseAlpha * flicker;
      ctx.save();
      ctx.globalAlpha = sunAlpha;
      ctx.translate(sun.x, sun.y);
      ctx.scale(sun.rx / sun.ry, 1);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, sun.ry);
      grad.addColorStop(0, 'rgba(255,251,230,1)');
      grad.addColorStop(0.3, 'rgba(255,224,102,0.8)');
      grad.addColorStop(0.7, 'rgba(255,179,71,0.4)');
      grad.addColorStop(1, 'rgba(255,36,0,0)');
      ctx.beginPath();
      ctx.arc(0, 0, sun.ry, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;

      // Draw twinkling stars (always above the sun)
      for (const star of stars) {
        const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase) * 0.35 + 0.65;
        ctx.globalAlpha = Math.max(0, Math.min(1, star.baseAlpha * twinkle));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fffbe6';
        ctx.shadowColor = '#fffbe6';
        ctx.shadowBlur = 6 * star.r;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(drawScene);
    }
    animationId = requestAnimationFrame(drawScene);

    function handleResize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      // Re-generate stars for new size
      const newCount = Math.floor((width * height) / 1200);
      stars.length = 0;
      for (let i = 0; i < newCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.7 + Math.random() * 1.7,
          baseAlpha: 0.5 + Math.random() * 0.5,
          twinkleSpeed: 0.5 + Math.random() * 1.5,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
      sun.x = width / 2;
      sun.y = height * 0.04;
      sun.rx = width * 0.45;
      sun.ry = height * 0.18;
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={starfieldRef}
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
      width={typeof window !== 'undefined' ? window.innerWidth : undefined}
      height={typeof window !== 'undefined' ? window.innerHeight : undefined}
    />
  );
};

export default BackgroundCanvas;