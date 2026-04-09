import { useState, useEffect, useRef } from 'react';
import { TextInput } from '@/components/TextInput';
import { ResultsTabs, SummaryResult } from '@/components/ResultsTabs';
import { LoadingState } from '@/components/LoadingState';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { countWords } from '@/lib/pdf-parser';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Headphones } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [originalWordCount, setOriginalWordCount] = useState(0);

  // Accessibility state
  const [dyslexicFont, setDyslexicFont] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [darkMode, setDarkMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [rulerY, setRulerY] = useState(200);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('font-dyslexic', dyslexicFont);
    root.classList.toggle('dark', darkMode);
    root.style.fontSize = fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px';
  }, [dyslexicFont, darkMode, fontSize]);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setResult(null);
    setOriginalWordCount(countWords(text));

    try {
      const { data, error } = await supabase.functions.invoke('summarize', { body: { text } });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({ variant: 'destructive', title: 'Rate Limited', description: 'Please wait a moment and try again.' });
        } else if (data.error.includes('Payment')) {
          toast({ variant: 'destructive', title: 'Credits Needed', description: 'Please add credits to your workspace.' });
        } else {
          throw new Error(data.error);
        }
        return;
      }
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Summarization Failed', description: err.message || 'Something went wrong.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOriginalWordCount(0);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header
        dyslexicFont={dyslexicFont} setDyslexicFont={setDyslexicFont}
        fontSize={fontSize} setFontSize={setFontSize}
        darkMode={darkMode} setDarkMode={setDarkMode}
        showRuler={showRuler} setShowRuler={setShowRuler}
        onReset={handleReset} hasResult={!!result}
      />

      {/* Reading Ruler */}
      <AnimatePresence>
        {showRuler && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 z-40 pointer-events-none"
            style={{ top: 0 }}
          >
            <div className="absolute inset-x-0 bg-foreground/5" style={{ top: 0, height: rulerY - 30 }} />
            <div className="absolute inset-x-0 border-y-2 border-primary/30" style={{ top: rulerY - 30, height: 60 }} />
            <div className="absolute inset-x-0 bg-foreground/5" style={{ top: rulerY + 30, height: `calc(100vh - ${rulerY + 30}px)` }} />
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

      {/* Hero */}
      {!result && !isLoading && (
        <header className="pt-12 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Study <span className="text-primary">Smarter</span>,
              <br />Not Harder
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Paste any text or upload a PDF. Get an AI summary, key terms, and listen with text-to-speech — designed for readers who learn differently.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> AI Summary</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-accent" /> Key Terms</span>
              <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-warm" /> Listen</span>
            </div>
          </motion.div>
        </header>
      )}

      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        {!result && <TextInput onSubmit={handleSubmit} isLoading={isLoading} />}
        {isLoading && <LoadingState />}
        <div ref={resultsRef}>
          {result && !isLoading && (
            <ResultsTabs result={result} originalWordCount={originalWordCount} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
