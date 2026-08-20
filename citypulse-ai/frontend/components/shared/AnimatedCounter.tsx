"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  duration?: number;   // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Counts up from 0 to `to` when the element enters the viewport.
 */
export default function AnimatedCounter({
  to,
  duration = 1500,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref        = useRef<HTMLSpanElement>(null);
  const isInView   = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);
  const frameRef   = useRef<number>(0);

  useEffect(() => {
    if (!isInView) return;
    const start     = performance.now();
    const startVal  = 0;

    const tick = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setValue(startVal + (to - startVal) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isInView, to, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
