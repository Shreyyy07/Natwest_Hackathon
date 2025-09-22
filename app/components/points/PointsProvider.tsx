'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type PointsContextType = {
  points: number;
  addPoints: (amount: number) => void;
  resetPoints: () => void;
  lastEarned: number;
};

const PointsContext = createContext<PointsContextType | null>(null);
const STORAGE_KEY = 'tayyari.points';

function PointsProvider({ children }: { children: React.ReactNode }) {
  const [points, setPoints] = useState(0);
  const [lastEarned, setLastEarned] = useState(0);
  const saveRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPoints(Math.max(0, parseInt(raw, 10) || 0));
    } catch {}
  }, []);

  useEffect(() => {
    if (saveRef.current !== points) {
      saveRef.current = points;
      try { localStorage.setItem(STORAGE_KEY, String(points)); } catch {}
    }
  }, [points]);

  const addPoints = (amount: number) => {
    if (!amount) return;
    setPoints(prev => {
      const next = Math.max(0, prev + amount);
      setLastEarned(amount);
      return next;
    });
    setTimeout(() => setLastEarned(0), 1200);
  };

  const resetPoints = () => {
    setPoints(0);
    setLastEarned(0);
  };

  const value = useMemo(() => ({ points, addPoints, resetPoints, lastEarned }), [points, lastEarned]);
  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export default PointsProvider;

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error('usePoints must be used within <PointsProvider>');
  return ctx;
}