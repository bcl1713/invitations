'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const DESIGN_WIDTH = 600;
const DESIGN_HEIGHT = 900;

export function ScaledPostcardCanvas({
  children,
  className = '',
  stageClassName = '',
}: {
  children: ReactNode;
  className?: string;
  stageClassName?: string;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateScale = () => setScale(Math.max(0.1, canvas.clientWidth / DESIGN_WIDTH));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={canvasRef} className={`postcard-canvas ${className}`}>
      <div
        className={`postcard-stage ${stageClassName}`}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
