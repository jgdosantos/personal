import { useEffect, useRef } from 'react';

const TailedCursor = ({
  baseThickness = 30,
  colors = ['#000000'],
  speedMultiplier = 0.5,
  maxAge = 500,
  enableFade = false,
  enableShaderEffect = false,
}) => {
  const canvasRef = useRef(null);
  const optsRef = useRef(null);
  optsRef.current = { baseThickness, colors, speedMultiplier, maxAge, enableFade, enableShaderEffect };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let mouseX = null;
    let mouseY = null;
    let headX = null;
    let headY = null;
    let trail = [];
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      if (headX === null) {
        headX = e.clientX;
        headY = e.clientY;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const drawRibbon = (points, color) => {
      if (points.length < 2) return;
      const { baseThickness, enableFade, enableShaderEffect } = optsRef.current;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (enableShaderEffect) {
        ctx.shadowBlur = baseThickness * 0.6;
        ctx.shadowColor = color;
      }

      const len = points.length;
      for (let i = 1; i < len; i++) {
        const t = i / (len - 1); // 0 = oldest/tail, 1 = newest/head
        ctx.beginPath();
        ctx.lineWidth = baseThickness * t;
        ctx.globalAlpha = enableFade ? t : 1;
        ctx.strokeStyle = color;
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }

      ctx.restore();
    };

    const draw = () => {
      const { speedMultiplier, maxAge, colors } = optsRef.current;
      const now = Date.now();

      if (headX !== null) {
        headX += (mouseX - headX) * speedMultiplier;
        headY += (mouseY - headY) * speedMultiplier;
        trail.push({ x: headX, y: headY, t: now });
      }

      trail = trail.filter((p) => now - p.t < maxAge);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (trail.length >= 2) {
        for (const color of colors) {
          drawRibbon(trail, color);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default TailedCursor;
