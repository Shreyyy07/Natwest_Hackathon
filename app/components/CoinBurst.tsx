'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

type CoinBurstProps = {
  fromRect: DOMRect | null;
  toElementId?: string; // default: 'points-wallet'
  count?: number;       // number of coins to animate
  onComplete?: () => void;
};

function useRects(fromRect: DOMRect | null, toElementId: string) {
  const [toRect, setToRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.getElementById(toElementId);
    if (!el) return;
    const update = () => setToRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [toElementId]);

  return { toRect };
}

export default function CoinBurst({ fromRect, toElementId = 'points-wallet', count = 6, onComplete }: CoinBurstProps) {
  const { toRect } = useRects(fromRect, toElementId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const coins = useMemo(() => Array.from({ length: Math.max(1, Math.min(count, 12)) }, (_, i) => i), [count]);

  if (!mounted || !fromRect || !toRect) return null;

  const start = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2,
  };
  const end = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2,
  };

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {coins.map((i) => {
        // random small spread
        const dx = (Math.random() - 0.5) * 120;
        const dy = -40 - Math.random() * 60;
        const delay = 0.05 * i;
        const duration = 0.75 + Math.random() * 0.25;

        return (
          <motion.div
            key={i}
            initial={{ x: start.x, y: start.y, scale: 0.2, opacity: 0 }}
            animate={{ x: [start.x + dx, end.x], y: [start.y + dy, end.y], scale: [1, 0.7], opacity: [1, 1] }}
            transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={i === coins.length - 1 ? onComplete : undefined}
            className="absolute"
            style={{ translateX: '-50%', translateY: '-50%' } as React.CSSProperties}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 ring-1 ring-amber-300/60 shadow-[0_8px_18px_rgba(0,0,0,0.3)] flex items-center justify-center">
              <span className="text-sm" aria-hidden>🪙</span>
            </div>
          </motion.div>
        );
      })}
    </div>,
    document.body
  );
}