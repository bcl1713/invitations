'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const DESIGN_WIDTH = 600;
const DESIGN_HEIGHT = 900;

export function ScaledPostcardCanvas({
  children,
  className = '',
  stageClassName = '',
  onOverflowChange,
}: {
  children: ReactNode;
  className?: string;
  stageClassName?: string;
  onOverflowChange?: (overflowing: boolean) => void;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateScale = () => setScale(Math.max(0.1, canvas.clientWidth / DESIGN_WIDTH));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const checkOverflow = () => {
      const card = stage.querySelector<HTMLElement>('.invitation-main-card');
      const nextOverflowing = Boolean(card && (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1));
      setOverflowing((current) => current === nextOverflowing ? current : nextOverflowing);
    };

    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(stage);
    const card = stage.querySelector<HTMLElement>('.invitation-main-card');
    if (card) resizeObserver.observe(card);
    const mutationObserver = new MutationObserver(checkOverflow);
    mutationObserver.observe(stage, { childList: true, characterData: true, subtree: true, attributes: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  useEffect(() => {
    onOverflowChange?.(overflowing);
  }, [onOverflowChange, overflowing]);

  return (
    <div ref={canvasRef} className={`postcard-canvas ${className}`}>
      <div
        ref={stageRef}
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
