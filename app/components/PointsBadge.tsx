'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { usePoints } from './points/PointsProvider';

export default function PointsBadge() {
  const { points, lastEarned } = usePoints();
  const [bumpKey, setBumpKey] = useState(0);
  const [deltaKey, setDeltaKey] = useState(0);
  const [showDelta, setShowDelta] = useState(false);

  useEffect(() => {
    if (lastEarned > 0) {
      setBumpKey(k => k + 1);
      setDeltaKey(k => k + 1);
      setShowDelta(true);
      const t = setTimeout(() => setShowDelta(false), 900);
      return () => clearTimeout(t);
    }
  }, [lastEarned]);

  return (
    <div className="relative">
      <AnimatePresence>
        {showDelta && (
          <motion.div
            key={deltaKey}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -12, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            className="absolute -top-3 -right-2 text-xs font-semibold text-emerald-300"
          >
            +{lastEarned}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        id="points-wallet"
        data-coin-target
        key={bumpKey}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 0.45 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200"
        title={`${points} points`}
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 ring-1 ring-amber-300/60 shadow-sm flex items-center justify-center">
          <span className="text-xs" aria-hidden>🪙</span>
        </div>
        <span className="text-sm font-semibold">{points}</span>
      </motion.div>
    </div>
  );
}