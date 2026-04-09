import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const messages = [
  "Reading your text carefully...",
  "Identifying key concepts...",
  "Creating a clear summary...",
  "Extracting important terms...",
  "Almost done!",
];

export function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="w-full max-w-xl mx-auto"
    >
      <div className="glass-card rounded-[2.5rem] p-10 md:p-14 flex flex-col items-center gap-8 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Brain className="w-16 h-16 text-primary relative z-10" />
        </motion.div>

        <div className="text-center space-y-6 relative z-10">
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            AI is Thinking...
          </h3>

          <div className="h-8 relative w-full flex justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-muted-foreground font-bold font-dyslexic text-lg absolute tracking-tight"
              >
                {messages[index]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4 relative z-10">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.5, 1],
                backgroundColor: [
                  "rgba(var(--primary), 0.2)",
                  "rgba(var(--primary), 1)",
                  "rgba(var(--primary), 0.2)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
