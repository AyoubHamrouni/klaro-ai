import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Timer,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleComplete = useCallback(() => {
    // Play a subtle notification sound if needed, or just visual
    const nextMode = !isBreak;
    setIsBreak(nextMode);
    setTimeLeft(nextMode ? 5 * 60 : 25 * 60);

    // Auto-start next session is often distracting for ADHD, better to require initiation
  }, [isBreak]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleComplete]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = (timeLeft / (isBreak ? 5 * 60 : 25 * 60)) * 100;

  return (
    <div className="glass-card rounded-[2rem] p-6 border-white/20 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
      {/* Background Pulse */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${isBreak ? "bg-success" : "bg-primary"} animate-pulse`}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isBreak ? (
            <Coffee className="w-5 h-5 text-success" />
          ) : (
            <Brain className="w-5 h-5 text-primary" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {isBreak ? "Recharge" : "Focus Session"}
          </span>
        </div>

        <div className="relative inline-block">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/5"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke={isBreak ? "var(--success)" : "var(--primary)"}
              strokeWidth="4"
              strokeDasharray="377"
              animate={{
                strokeDashoffset: 377 - (377 * (100 - progress)) / 100,
              }}
              transition={{ duration: 1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tighter tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <Timer className="w-4 h-4 text-muted-foreground/30 mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            size="icon"
            variant={isActive ? "outline" : "default"}
            className="w-12 h-12 rounded-2xl shadow-lg transition-all active:scale-95"
            onClick={toggleTimer}
          >
            {isActive ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-12 h-12 rounded-2xl hover:bg-white/10 text-muted-foreground transition-all"
            onClick={resetTimer}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {timeLeft === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 justify-center text-accent font-black text-xs uppercase tracking-widest pt-2"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            Session Done!
          </motion.div>
        )}
      </div>
    </div>
  );
}
