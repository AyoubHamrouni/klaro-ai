import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ReadAlongText } from "@/components/ReadAlongText";
import { FlashcardMode } from "@/components/FlashcardMode";
import { QuizInline } from "@/components/QuizInline";
import {
  BookOpen,
  Brain,
  Headphones,
  GraduationCap,
  BarChart3,
  Copy,
  Check,
  Layers,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export interface SummaryResult {
  summary: string;
  keyTerms: { term: string; definition: string }[];
  wordCount: number;
  difficulty_level: string;
  tasks?: string[];
  mindmapData?: string;
}

interface ResultsTabsProps {
  result: SummaryResult;
  originalWordCount: number;
}

const difficultyColors = {
  beginner: "bg-success text-success-foreground",
  intermediate: "bg-warm text-warm-foreground",
  advanced: "bg-destructive text-destructive-foreground",
};

export function ResultsTabs({ result, originalWordCount }: ResultsTabsProps) {
  const [copied, setCopied] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [digestMode, setDigestMode] = useState(false);
  const [digestIndex, setDigestIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Split summary into bite-sized chunks (sentences or short paragraphs)
  const chunks = result.summary
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 5);

  const reductionPercent = Math.round(
    (1 - result.wordCount / originalWordCount) * 100,
  );
  const readingTimeSaved = Math.round(
    (originalWordCount - result.wordCount) / 250,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
    toast({ title: "Copied!", description: "Summary copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lumina Summary</title>
            <style>
              body { font-family: 'Open Sans', Arial, sans-serif; line-height: 1.8; padding: 3rem; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
              h2 { color: #3b82f6; margin-top: 2rem; }
              ul { list-style-type: none; padding-left: 0; }
              li { margin-bottom: 1rem; padding: 1rem; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
              strong { color: #0f172a; }
            </style>
          </head>
          <body>
            <h1>Lumina Summary</h1>
            <p style="font-size: 1.1rem;">${result.summary}</p>
            <h2>Key Terms</h2>
            <ul>
              ${result.keyTerms.map((t) => `<li><strong>${t.term}:</strong> ${t.definition}</li>`).join("")}
            </ul>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <BarChart3 className="w-8 h-8 text-primary shrink-0 relative z-10" />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-primary">
              {reductionPercent}%
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
              Focus Gain
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <BookOpen className="w-8 h-8 text-accent shrink-0 relative z-10" />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-accent">
              {readingTimeSaved}m
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
              Time Saved
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warm/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <Brain className="w-8 h-8 text-warm shrink-0 relative z-10" />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-warm">
              {result.keyTerms.length}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
              Mastery Items
            </p>
          </div>
        </div>
      </div>

      {/* Word count bar */}
      <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between text-sm mb-3 relative z-10">
          <span className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Content Optimization: {originalWordCount} → {result.wordCount} words
          </span>
          <Badge
            className={`${difficultyColors[result.difficulty_level]} rounded-lg px-2 py-0.5 border-none shadow-sm`}
          >
            {result.difficulty_level}
          </Badge>
        </div>
        <Progress value={reductionPercent} className="h-2.5 bg-secondary/50" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-11">
          <TabsTrigger value="summary" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4 hidden sm:block" />
            Study
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="w-4 h-4 hidden sm:block" />
            Terms
          </TabsTrigger>
          <TabsTrigger value="listen" className="gap-1.5 text-xs sm:text-sm">
            <Headphones className="w-4 h-4 hidden sm:block" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="w-4 h-4 hidden sm:block" />
            Quiz
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="glass-card rounded-2xl overflow-hidden p-6 min-h-[400px] flex flex-col">
            <div className="pb-4 flex flex-row items-center justify-between border-b border-border/10 mb-6 shrink-0">
              <h3 className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {digestMode ? (
                  <Sparkles className="w-6 h-6 text-primary" />
                ) : (
                  <BookOpen className="w-6 h-6 text-primary" />
                )}
                {digestMode ? "Quick Bites" : "Key Summary"}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDigestMode(!digestMode);
                    setDigestIndex(0);
                  }}
                  className={`h-9 border-white/20 font-bold uppercase tracking-widest text-[10px] ${digestMode ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  {digestMode ? "Full View" : "Digest Mode"}
                </Button>
                {!digestMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="h-9 border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider hidden sm:flex"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-9 opacity-70 hover:opacity-100"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {digestMode ? (
                  <motion.div
                    key={digestIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col flex-1 justify-center py-8 text-center"
                  >
                    <p className="font-dyslexic text-2xl md:text-3xl leading-relaxed font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
                      {chunks[digestIndex]}
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-6">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setDigestIndex(Math.max(0, digestIndex - 1))
                        }
                        disabled={digestIndex === 0}
                        className="w-12 h-12 rounded-full border-white/10 bg-white/5"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground tabular-nums">
                        {digestIndex + 1} / {chunks.length}
                      </div>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() =>
                          setDigestIndex(
                            Math.min(chunks.length - 1, digestIndex + 1),
                          )
                        }
                        disabled={digestIndex === chunks.length - 1}
                        className="w-12 h-12 rounded-full shadow-lg shadow-primary/20"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-dyslexic text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-wrap"
                  >
                    {result.summary}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* Key Terms Tab */}
        <TabsContent value="terms">
          <div className="glass-card rounded-2xl overflow-hidden p-6">
            <div className="pb-4 flex flex-row items-center justify-between border-b border-border/10 mb-6">
              <h3 className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-warm to-accent">
                <Brain className="w-6 h-6 text-warm" /> Knowledge Map
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-white/20 bg-white/5 hover:bg-white/10 font-semibold"
                onClick={() => setFlashcardMode(!flashcardMode)}
              >
                <Layers className="w-4 h-4 mr-2" />
                {flashcardMode ? "List View" : "3D Flashcards"}
              </Button>
            </div>
            {flashcardMode ? (
              <FlashcardMode
                keyTerms={result.keyTerms}
                onClose={() => setFlashcardMode(false)}
              />
            ) : (
              <Accordion type="multiple" className="w-full">
                {result.keyTerms.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`term-${i}`}
                    className="border-border/10"
                  >
                    <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary transition-colors py-4">
                      {item.term}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="font-dyslexic text-lg leading-relaxed text-muted-foreground bg-primary/5 p-4 rounded-xl border border-primary/10">
                        {item.definition}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </TabsContent>

        {/* Listen Tab */}
        <TabsContent value="listen">
          <div className="space-y-6">
            <AudioPlayer
              text={result.summary}
              onProgressChange={setAudioProgress}
              onPlayingChange={setAudioPlaying}
            />
            <div className="glass-card rounded-2xl overflow-hidden p-6">
              <div className="pb-4 flex items-center gap-2 border-b border-border/10 mb-6">
                <Headphones className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-bold">Immersive Read-Along</h3>
              </div>
              <ReadAlongText
                text={result.summary}
                progress={audioProgress}
                isPlaying={audioPlaying}
              />
            </div>
          </div>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz">
          <div className="glass-card rounded-2xl overflow-hidden p-6">
            <div className="pb-4 flex items-center gap-2 border-b border-border/10 mb-6">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Mastery Challenge</h3>
            </div>
            <QuizInline text={result.summary} />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
