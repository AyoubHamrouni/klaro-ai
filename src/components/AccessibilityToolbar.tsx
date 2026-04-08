import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Type, Minus, Plus, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AccessibilityToolbar() {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [dyslexicFont, setDyslexicFont] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [rulerY, setRulerY] = useState(200);

  const fontSizeClass = {
    normal: '',
    large: 'text-lg',
    xlarge: 'text-xl',
  };

  // Apply to document
  const root = document.documentElement;
  root.classList.toggle('font-dyslexic', dyslexicFont);
  root.style.fontSize = fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 z-50 flex gap-1 bg-card/90 backdrop-blur-sm border rounded-lg p-1.5 shadow-lg"
      >
        <Button
          variant={dyslexicFont ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setDyslexicFont(!dyslexicFont)}
          title="Toggle dyslexia-friendly font"
        >
          <Type className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setFontSize(f => f === 'normal' ? 'large' : f === 'large' ? 'xlarge' : 'normal')}
          title="Adjust text size"
        >
          {fontSize === 'normal' ? <Plus className="w-4 h-4" /> : fontSize === 'xlarge' ? <Minus className="w-4 h-4" /> : <Type className="w-4 h-4" />}
        </Button>
        <Button
          variant={showRuler ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowRuler(!showRuler)}
          title="Reading ruler"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {showRuler && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 z-40 pointer-events-none"
            style={{ top: 0 }}
          >
            <div
              className="absolute inset-x-0 bg-foreground/5"
              style={{ top: 0, height: rulerY - 30 }}
            />
            <div
              className="absolute inset-x-0 border-y-2 border-primary/30"
              style={{ top: rulerY - 30, height: 60 }}
            />
            <div
              className="absolute inset-x-0 bg-foreground/5 bottom-0"
              style={{ top: rulerY + 30, bottom: 0, height: `calc(100vh - ${rulerY + 30}px)` }}
            />
            <div
              className="absolute inset-x-0 pointer-events-auto cursor-ns-resize"
              style={{ top: rulerY - 40, height: 80 }}
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startRulerY = rulerY;
                const onMove = (ev: MouseEvent) => setRulerY(Math.max(40, startRulerY + ev.clientY - startY));
                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
