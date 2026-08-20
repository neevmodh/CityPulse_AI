"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

const STAGES = [
  { emoji: "📷", label: "Image received" },
  { emoji: "🔍", label: "Detecting issue type (YOLO)..." },
  { emoji: "🧠", label: "Gemini analyzing severity..." },
  { emoji: "📍", label: "Checking location context..." },
  { emoji: "⚡", label: "Calculating risk score..." },
  { emoji: "✅", label: "Analysis complete!" },
];

const STAGE_DELAY_MS = 800;

interface AIPipelineProps {
  active: boolean;   // starts the animation when true
  onComplete?: () => void;
}

export default function AIPipeline({ active, onComplete }: AIPipelineProps) {
  const [currentStage, setCurrentStage] = useState<number>(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!active) {
      // Reset
      setCurrentStage(-1);
      setCompletedStages([]);
      return;
    }

    // Kick off the pipeline
    setCurrentStage(0);
    setCompletedStages([]);

    STAGES.forEach((_, i) => {
      const timer = setTimeout(() => {
        setCurrentStage(i);
        if (i > 0) {
          setCompletedStages((prev) => [...prev, i - 1]);
        }
        if (i === STAGES.length - 1) {
          // Final stage → mark complete after one extra delay
          const completionTimer = setTimeout(() => {
            setCompletedStages((prev) => [...prev, i]);
            onComplete?.();
          }, STAGE_DELAY_MS);
          timersRef.current.push(completionTimer);
        }
      }, i * STAGE_DELAY_MS);
      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active && completedStages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
          <span className="text-xs">🤖</span>
        </div>
        <span className="text-xs font-semibold text-gray-700">CityPulse AI Analysis Pipeline</span>
        <span className="ml-auto text-[10px] text-gray-400 font-mono">Gemini + YOLOv8</span>
      </div>

      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const isDone    = completedStages.includes(i);
          const isActive  = currentStage === i && !isDone;
          const isPending = currentStage < i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{
                opacity: isPending ? 0.35 : 1,
                x: 0,
              }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Status icon */}
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div key="spin">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dot"
                      className="w-2 h-2 rounded-full bg-gray-300"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Stage label */}
              <span
                className={`text-sm transition-colors duration-300 ${
                  isDone
                    ? "text-green-700 font-medium line-through decoration-green-400/50"
                    : isActive
                    ? "text-blue-700 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {stage.emoji} {stage.label}
              </span>

              {/* Active pulse bar */}
              {isActive && (
                <motion.div
                  className="ml-auto h-1 rounded-full bg-blue-400/30 flex-1 max-w-20 overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: STAGE_DELAY_MS / 1000 - 0.1, ease: "linear" }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
