import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadingRulerProps {
  isVisible: boolean;
}

export function ReadingRuler({ isVisible }: ReadingRulerProps) {
  const [position, setPosition] = useState(200);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isVisible) {
        setPosition(e.clientY);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isVisible]);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 pointer-events-none z-50 flex flex-col"
            style={{ top: 0, height: "100vh" }}
          >
            {/* Top Dimmer */}
            <div
              className="bg-black/20 backdrop-blur-[1px] transition-all duration-75"
              style={{ height: position - 40 }}
            />

            {/* Active Window */}
            <div className="h-20 border-y-2 border-primary/40 bg-primary/5 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-primary/20" />
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary/20" />
            </div>

            {/* Bottom Dimmer */}
            <div className="flex-1 bg-black/20 backdrop-blur-[1px] transition-all duration-75" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
