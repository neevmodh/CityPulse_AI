"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface RiskCounterProps {
  target: number;
  duration?: number; // ms, default 1500
  className?: string;
  showLabel?: boolean;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function priorityLabel(score: number) {
  if (score >= 80) return { text: "P1 CRITICAL", color: "#dc2626" };
  if (score >= 60) return { text: "P2 HIGH",     color: "#ea580c" };
  if (score >= 40) return { text: "P3 MEDIUM",   color: "#ca8a04" };
  return               { text: "P4 LOW",         color: "#16a34a" };
}

export default function RiskCounter({
  target,
  duration = 1500,
  className = "",
  showLabel = true,
}: RiskCounterProps) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    setCount(0);

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed  = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      setCount(Math.round(target * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  const { text, color } = priorityLabel(count);
  const arc = ((count / 100) * 251.2).toFixed(1); // 2π × 40 ≈ 251.2

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Mini arc gauge */}
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle cx="44" cy="44" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <motion.circle
            cx="44" cy="44" r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - Number(arc) }}
            transition={{ duration: duration / 1000, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {count}
          </span>
        </div>
      </div>

      {showLabel && (
        <motion.span
          key={text}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}
