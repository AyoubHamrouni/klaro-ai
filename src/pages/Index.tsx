import { useState } from 'react';
import { TextInput } from '@/components/TextInput';
import { ResultsDisplay, SummaryResult } from '@/components/ResultsDisplay';
import { LoadingState } from '@/components/LoadingState';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { countWords } from '@/lib/pdf-parser';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Headphones } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [originalWordCount, setOriginalWordCount] = useState(0);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setResult(null);
    setOriginalWordCount(countWords(text));

    try {
      const { data, error } = await supabase.functions.invoke('summarize', {
        body: { text },
      });

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
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Summarization Failed',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AccessibilityToolbar />

      {/* Header */}
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
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> AI Summary
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-accent" /> Key Terms
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-warm" /> Listen
            </span>
          </div>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
        <TextInput onSubmit={handleSubmit} isLoading={isLoading} />

        {isLoading && <LoadingState />}

        {result && !isLoading && (
          <ResultsDisplay result={result} originalWordCount={originalWordCount} />
        )}
      </main>
    </div>
  );
};

export default Index;
