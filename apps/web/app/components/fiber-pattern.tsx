"use client";

import { useEffect, useRef, useId, useState } from "react";

interface FiberPatternProps {
  className?: string;
  opacity?: number;
  animated?: boolean;
  density?: "sparse" | "normal" | "dense";
}

// Throttle to ~30fps for better performance
const FRAME_INTERVAL = 1000 / 30;

export function FiberPattern({
  className = "",
  opacity = 0.12,
  animated = false,
  density = "normal",
}: FiberPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seedRef = useRef(Math.random() * 1000);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer to only animate when visible
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const numLines = density === "sparse" ? 6 : density === "dense" ? 16 : 10;
    const seed = seedRef.current;

    const seededRandom = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };

    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        draw(0);
      }, 100);
    };

    const draw = (offset: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < numLines; i++) {
        const lineOpacity = opacity * (0.6 + seededRandom(i) * 0.4);
        ctx.strokeStyle = `rgba(232, 90, 44, ${lineOpacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const startX = (width / numLines) * i + seededRandom(i + 100) * 40;
        const startY = -20;

        ctx.moveTo(startX, startY);

        let currentX = startX;
        let currentY = startY;

        const segments = 8;
        for (let j = 0; j < segments; j++) {
          const nextY = currentY + (height + 40) / segments;
          const waveIntensity = 20 + seededRandom(i + j) * 20;
          const waveOffset = Math.sin((j + i) * 0.7 + offset * 0.008) * waveIntensity;
          const nextX = currentX + Math.sin(j * 0.5 + i + offset * 0.003) * 15;

          ctx.bezierCurveTo(
            currentX + waveOffset,
            currentY + (nextY - currentY) * 0.33,
            currentX - waveOffset * 0.5,
            currentY + (nextY - currentY) * 0.66,
            nextX,
            nextY
          );

          currentX = nextX;
          currentY = nextY;
        }

        ctx.stroke();
      }
    };

    // Initial draw
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    draw(0);

    window.addEventListener("resize", resize);

    let animationFrame: number;
    let offset = 0;
    let lastFrameTime = 0;

    if (animated && isVisible) {
      const animate = (currentTime: number) => {
        // Throttle to target frame rate
        if (currentTime - lastFrameTime >= FRAME_INTERVAL) {
          offset += 1;
          draw(offset);
          lastFrameTime = currentTime;
        }
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      clearTimeout(resizeTimeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [opacity, animated, density, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ width: "100%", height: "100%", willChange: animated ? "contents" : "auto" }}
    />
  );
}

// SVG version with unique IDs for static backgrounds
export function FiberPatternStatic({
  className = "",
  opacity = 0.1,
}: {
  className?: string;
  opacity?: number;
}) {
  const id = useId();
  const patternId = `fiber-${id}`;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width="120" height="240">
          <path
            d="M10 0 Q 30 60, 15 120 T 25 240"
            fill="none"
            stroke={`rgba(232, 90, 44, ${opacity})`}
            strokeWidth="1"
          />
          <path
            d="M50 0 Q 70 60, 55 120 T 65 240"
            fill="none"
            stroke={`rgba(232, 90, 44, ${opacity * 0.7})`}
            strokeWidth="1"
          />
          <path
            d="M90 0 Q 110 60, 95 120 T 105 240"
            fill="none"
            stroke={`rgba(232, 90, 44, ${opacity * 0.5})`}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

// Simple horizontal accent line
export function FiberAccent({ className = "" }: { className?: string }) {
  return (
    <div
      className={`via-accent/40 h-px w-full bg-gradient-to-r from-transparent to-transparent ${className}`}
    />
  );
}

// Corner fiber decoration - simplified
export function FiberCorner({
  position = "top-left",
  className = "",
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scale(-1, 1)",
    "bottom-left": "scale(1, -1)",
    "bottom-right": "scale(-1, -1)",
  };

  const positions: Record<string, React.CSSProperties> = {
    "top-left": { top: 0, left: 0 },
    "top-right": { top: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
    "bottom-right": { bottom: 0, right: 0 },
  };

  return (
    <svg
      className={`pointer-events-none absolute h-48 w-48 ${className}`}
      style={{ ...positions[position], transform: transforms[position] }}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0 Q 60 30, 80 100 Q 100 170, 120 200"
        fill="none"
        stroke="rgba(232, 90, 44, 0.2)"
        strokeWidth="1.5"
      />
      <path
        d="M0 30 Q 40 60, 50 120 Q 60 180, 70 200"
        fill="none"
        stroke="rgba(232, 90, 44, 0.15)"
        strokeWidth="1"
      />
      <path
        d="M30 0 Q 80 40, 100 90 Q 120 140, 160 200"
        fill="none"
        stroke="rgba(232, 90, 44, 0.1)"
        strokeWidth="1"
      />
    </svg>
  );
}
