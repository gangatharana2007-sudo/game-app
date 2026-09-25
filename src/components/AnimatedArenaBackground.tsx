import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useMotion, MotionMode } from '../context/MotionContext.js';

export interface AnimatedArenaBackgroundProps {
  currentPage?: string;
  isLiveGame?: boolean;
  isCountdown?: boolean;
  className?: string;
}

// Deterministic pseudo-random number generator (LCG) to ensure reproducible positions
function createSeededRandom(seed = 1337) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const AnimatedArenaBackground: React.FC<AnimatedArenaBackgroundProps> = ({
  currentPage = 'landing',
  isLiveGame: explicitIsLiveGame,
  isCountdown: explicitIsCountdown,
  className = '',
}) => {
  const { motionMode } = useMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isTabHiddenRef = useRef<boolean>(false);
  const [arenaPhase, setArenaPhase] = useState<string>('normal');

  useEffect(() => {
    const checkPhase = () => {
      const phase = document.documentElement.getAttribute('data-arena-phase') || 'normal';
      setArenaPhase(phase);
    };
    checkPhase();
    const observer = new MutationObserver(checkPhase);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-arena-phase'] });
    return () => observer.disconnect();
  }, []);

  // Derive page context if not explicitly provided
  const isLive = explicitIsLiveGame ?? (currentPage === 'live-game');
  const isCountdown = explicitIsCountdown ?? (currentPage === 'pre-match-lobby' || arenaPhase === 'countdown');

  // Generate 24 deterministic particle seeds once
  const deterministicParticles = useMemo(() => {
    const rng = createSeededRandom(42949);
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: rng() * 100, // percentage 0-100%
      y: rng() * 100,
      size: 1.2 + rng() * 2.2, // px
      speedY: 0.12 + rng() * 0.25, // vertical drift
      speedX: (rng() - 0.5) * 0.1, // horizontal sway
      opacity: 0.2 + rng() * 0.45,
      color: i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'violet' : 'blue',
      pulseSpeed: 3 + rng() * 4,
    }));
  }, []);

  // Canvas particle renderer for GPU-friendly, lightweight floating particles (only in 'full' mode)
  useEffect(() => {
    if (motionMode !== 'full') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
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

    // Particle state initialized from deterministic seeds
    const particles = deterministicParticles.map((p) => ({
      x: (p.x / 100) * width,
      y: (p.y / 100) * height,
      size: p.size,
      speedY: p.speedY * (isLive ? 0.4 : 0.8), // slower in live game
      speedX: p.speedX,
      opacity: p.opacity * (isLive ? 0.35 : 1),
      color: p.color === 'cyan' ? 'rgba(0, 229, 255,' : p.color === 'violet' ? 'rgba(124, 58, 237,' : 'rgba(37, 99, 235,',
      pulse: Math.random() * Math.PI,
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      // Pause animation if browser tab is hidden to save battery & CPU
      if (isTabHiddenRef.current || document.hidden) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const globalAlpha = isLive ? 0.3 : 0.85;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY * 35 * dt;
        p.x += Math.sin(time * 0.0008 + p.pulse) * 0.2;

        // Wrap around smoothly
        if (p.y < -10) {
          p.y = height + 10;
          p.x = (deterministicParticles[i].x / 100) * width;
        }

        const alpha = p.opacity * globalAlpha * (0.7 + 0.3 * Math.sin(time * 0.0015 + p.pulse));

        ctx.fillStyle = `${p.color} ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle soft glow around larger particles
        if (p.size > 2.0 && !isLive) {
          ctx.fillStyle = `${p.color} ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [motionMode, isLive, deterministicParticles]);

  // Tab visibility listener to pause animations when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabHiddenRef.current = document.hidden;
      if (document.hidden) {
        document.documentElement.style.setProperty('--arena-anim-play-state', 'paused');
      } else if (motionMode === 'full') {
        document.documentElement.style.setProperty('--arena-anim-play-state', 'running');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [motionMode]);

  // CSS variables dynamically tuned for page context
  const contextStyles = useMemo(() => {
    if (isLive && isCountdown) {
      // In live match countdown: subtle central spotlight with soft focus, without flashing
      return {
        '--arena-aurora-opacity': '0.18',
        '--arena-particles-opacity': '0.22',
        '--arena-grid-opacity': '0.1',
        '--arena-waves-opacity': '0.1',
        '--arena-glow-intensity': '0.55',
        '--spotlight-cyan-alpha': '0.09',
        '--spotlight-violet-alpha': '0.08',
      } as React.CSSProperties;
    }

    if (isLive) {
      // In active live match: heavily dim background to guarantee 100% clarity and zero distraction
      return {
        '--arena-aurora-opacity': '0.1',
        '--arena-particles-opacity': '0.15',
        '--arena-grid-opacity': '0.08',
        '--arena-waves-opacity': '0.07',
        '--arena-glow-intensity': '0.18',
        '--spotlight-cyan-alpha': '0.025',
        '--spotlight-violet-alpha': '0.025',
      } as React.CSSProperties;
    }

    if (isCountdown) {
      // In pre-match lobby countdown: gently focus central spotlight glow without harsh flashing
      return {
        '--arena-aurora-opacity': '0.45',
        '--arena-particles-opacity': '0.5',
        '--arena-grid-opacity': '0.16',
        '--arena-waves-opacity': '0.25',
        '--arena-glow-intensity': '0.7',
        '--spotlight-cyan-alpha': '0.14',
        '--spotlight-violet-alpha': '0.12',
      } as React.CSSProperties;
    }

    // Default rich cyber-arena styling
    return {
      '--arena-aurora-opacity': '0.38',
      '--arena-particles-opacity': '0.6',
      '--arena-grid-opacity': '0.14',
      '--arena-waves-opacity': '0.25',
      '--arena-glow-intensity': '0.45',
      '--spotlight-cyan-alpha': '0.08',
      '--spotlight-violet-alpha': '0.07',
    } as React.CSSProperties;
  }, [isLive, isCountdown]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
      style={contextStyles}
    >
      {/* Layer 1: Solid Dark Navy Arena Base */}
      <div className="absolute inset-0 bg-[#050816]" />

      {/* Layer 2: Slow-Moving Organic Aurora (18s to 30s) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          motionMode === 'off' ? 'opacity-10' : 'opacity-100'
        }`}
      >
        {/* Cyan Aurora Orb (Upper Left/Center) */}
        <div
          className={`absolute -top-32 -left-20 w-[55vw] h-[55vw] rounded-full blur-[110px] pointer-events-none ${
            motionMode === 'full' ? 'arena-aurora-cyan' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(0, 229, 255, var(--arena-aurora-opacity)) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 75%)',
          }}
        />

        {/* Violet Aurora Orb (Lower Right/Center) */}
        <div
          className={`absolute -bottom-40 -right-20 w-[60vw] h-[60vw] rounded-full blur-[130px] pointer-events-none ${
            motionMode === 'full' ? 'arena-aurora-violet' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, var(--arena-aurora-opacity)) 0%, rgba(217, 70, 239, 0.12) 50%, transparent 75%)',
          }}
        />

        {/* Deep Blue Horizon Wash */}
        <div
          className={`absolute top-1/3 left-1/4 w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none ${
            motionMode === 'full' ? 'arena-aurora-blue' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.08) 55%, transparent 75%)',
          }}
        />
      </div>

      {/* Layer 3: Thin Digital Cyber Grid Lines */}
      <div
        className={`absolute inset-0 arena-cyber-grid transition-opacity duration-700 ${
          motionMode === 'full' && !isLive ? 'arena-grid-drift' : ''
        }`}
        style={{
          opacity: 'var(--arena-grid-opacity)',
        }}
      />

      {/* Layer 4: Faint Hexagonal & Circuit Pattern */}
      {motionMode !== 'off' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] transition-opacity duration-700"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="arena-hex-circuits" width="120" height="104" patternUnits="userSpaceOnUse">
              {/* Hexagonal Node */}
              <polygon
                points="60,2 110,28 110,76 60,102 10,76 10,28"
                fill="none"
                stroke="#00e5ff"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              <circle cx="60" cy="2" r="1.5" fill="#00e5ff" />
              <circle cx="110" cy="28" r="1.5" fill="#7c3aed" />
              <circle cx="60" cy="102" r="1.5" fill="#00e5ff" />
              <circle cx="10" cy="76" r="1.5" fill="#7c3aed" />
              {/* Circuit traces */}
              <path d="M 60,52 L 85,52 L 100,38" fill="none" stroke="#7c3aed" strokeWidth="0.6" />
              <path d="M 60,52 L 35,52 L 20,66" fill="none" stroke="#00e5ff" strokeWidth="0.6" />
              <circle cx="60" cy="52" r="2.2" fill="#00e5ff" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arena-hex-circuits)" />
        </svg>
      )}

      {/* Layer 5: Soft Cyan & Violet Energy Wave Ribbons */}
      {motionMode !== 'off' && (
        <svg
          className={`absolute bottom-0 left-0 right-0 w-full h-[45vh] transition-opacity duration-700 pointer-events-none ${
            motionMode === 'full' ? 'arena-wave-drift' : ''
          }`}
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ opacity: 'var(--arena-waves-opacity)' }}
        >
          <defs>
            <linearGradient id="waveGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
              <stop offset="35%" stopColor="#00e5ff" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveGradViolet" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#d946ef" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,192L60,186.7C120,181,240,171,360,181.3C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="url(#waveGradCyan)"
          />
          <path
            d="M0,256L60,240C120,224,240,192,360,197.3C480,203,600,245,720,256C840,267,960,245,1080,229.3C1200,213,1320,203,1380,197.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="url(#waveGradViolet)"
          />
        </svg>
      )}

      {/* Layer 6: Lightweight Floating Particles Canvas (active in 'full' mode) */}
      {motionMode === 'full' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 'var(--arena-particles-opacity)' }}
        />
      )}

      {/* Layer 7: Occasional Small Light Pulses (Peripheral Node Accents) */}
      {motionMode === 'full' && !isLive && (
        <>
          <div
            className="absolute top-24 right-1/4 w-2 h-2 rounded-full bg-cyan-400 arena-pulse-accent pointer-events-none"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute bottom-32 left-1/5 w-2 h-2 rounded-full bg-violet-400 arena-pulse-accent pointer-events-none"
            style={{ animationDelay: '4.5s' }}
          />
          <div
            className="absolute top-2/3 right-1/6 w-1.5 h-1.5 rounded-full bg-blue-400 arena-pulse-accent pointer-events-none"
            style={{ animationDelay: '9s' }}
          />
        </>
      )}

      {/* Layer 8: Subtle Radial Spotlight Behind Content */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
          isCountdown ? 'arena-spotlight-countdown' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 38%, rgba(0, 229, 255, var(--spotlight-cyan-alpha)) 0%, rgba(124, 58, 237, var(--spotlight-violet-alpha)) 45%, transparent 75%)`,
        }}
      />

      {/* Vignette Edge Shading for Cinematic Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(2, 4, 11, 0.75) 100%)',
        }}
      />
    </div>
  );
};
