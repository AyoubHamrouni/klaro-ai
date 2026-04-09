import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">
          Card {index + 1} of {keyTerms.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back to list
        </Button>
      </div>

      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="min-h-[200px] flex items-center justify-center p-8 bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="text-center space-y-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {flipped ? 'Definition' : 'Term'}
                </span>
                <p className={`font-dyslexic leading-relaxed ${flipped ? 'text-lg text-muted-foreground' : 'text-2xl font-bold'}`}>
                  {flipped ? current.definition : current.term}
                </p>
                <p className="text-xs text-muted-foreground">Tap to flip</p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prev} disabled={index === 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setIndex(0); setFlipped(false); }}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restart
        </Button>
        <Button variant="outline" size="icon" onClick={next} disabled={index === keyTerms.length - 1}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
