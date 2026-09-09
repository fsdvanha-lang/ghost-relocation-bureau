import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  phase: number;
}

export const OccultAmbientCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect system reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for ethereal repulsion
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Initialize 55 ethereal dust/spirit particles
    const particleCount = Math.min(60, Math.floor(width / 30));
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.45, // Slow upward drift
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.4,
        maxAlpha: Math.random() * 0.45 + 0.15,
        phase: Math.random() * Math.PI * 2
      });
    }

    let animId: number;

    const render = () => {
      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render drifting particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.phase += 0.02;
        p.x += p.vx + Math.sin(p.phase) * 0.2;
        p.y += p.vy;

        // Mouse gentle push
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (1 - dist / 140) * 0.6;
          p.x += (dx / dist) * force * 3;
          p.y += (dy / dist) * force * 3;
        }

        // Loop boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Calculate opacity with breathing cycle
        const currentAlpha = Math.sin(p.phase) * 0.2 + p.maxAlpha * 0.7;

        // Draw glowing particle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        gradient.addColorStop(0, `rgba(243, 243, 240, ${Math.max(0, currentAlpha)})`);
        gradient.addColorStop(0.5, `rgba(196, 181, 253, ${Math.max(0, currentAlpha * 0.4)})`);
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-40 select-none"
    />
  );
};
