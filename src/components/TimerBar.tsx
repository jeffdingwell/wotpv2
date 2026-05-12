import { motion } from 'motion/react';
import { useEffect, useState, useRef } from 'react';

interface TimerBarProps {
  duration: number; // in seconds
  onComplete: () => void;
  onNearComplete?: () => void;
  keyTrigger: string | number;
  isPaused?: boolean;
}

export default function TimerBar({ duration, onComplete, onNearComplete, keyTrigger, isPaused }: TimerBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const nearCompleteTriggered = useRef(false);
  const totalMs = duration * 1000;

  useEffect(() => {
    elapsedRef.current = 0;
    setElapsed(0);
    nearCompleteTriggered.current = false;
  }, [keyTrigger]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      elapsedRef.current += 100;
      const current = Math.min(elapsedRef.current, totalMs);
      
      setElapsed(current);

      if (!nearCompleteTriggered.current && onNearComplete && current >= totalMs - 2000) {
        nearCompleteTriggered.current = true;
        onNearComplete();
      }

      if (current >= totalMs) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, keyTrigger, onComplete, onNearComplete, totalMs]);

  return (
    <div className="fixed top-16 left-0 w-full h-[3px] bg-transparent z-40 overflow-hidden">
      <motion.div
        key={keyTrigger}
        initial={{ width: 0 }}
        animate={{ width: `${(elapsed / totalMs) * 100}%` }}
        transition={{ 
          duration: isPaused ? 0 : 0.1, 
          ease: "linear" 
        }}
        className="h-full bg-blue-600"
      />
    </div>
  );
}
