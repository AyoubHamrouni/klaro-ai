import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface FlashcardModeProps {
  keyTerms: { term: string; definition: string }[];
  onClose: () => void;
}

export function FlashcardMode({ keyTerms, onClose }: FlashcardModeProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = keyTerms[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, keyTerms.length - 1));
  };

  const prev = () => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 border-primary/20">
            Card {index + 1} of {keyTerms.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Back to list
        </Button>
      </div>

      <div
        className="relative perspective-1000 w-full h-64 md:h-80 cursor-pointer group"
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full"
        >
          {/* Front of Card */}
          <div
            className="absolute inset-0 backface-hidden glass-card flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-4 opacity-70">
              Term
            </span>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              {current.term}
            </h3>
            <p className="mt-6 text-xs text-muted-foreground opacity-50 font-medium">
              Click to reveal definition
            </p>
          </div>

          {/* Back of Card */}
          <div
            className="absolute inset-0 backface-hidden glass-card flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-4 opacity-70">
              Definition
            </span>
            <p className="font-dyslexic text-lg md:text-xl leading-relaxed text-muted-foreground">
              {current.definition}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-8 pt-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          disabled={index === 0}
          className="rounded-full w-12 h-12 shadow-lg border-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIndex(0);
            setFlipped(false);
          }}
          className="rounded-full w-10 h-10 opacity-50 hover:opacity-100"
          title="Restart"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          disabled={index === keyTerms.length - 1}
          className="rounded-full w-12 h-12 shadow-lg border-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
