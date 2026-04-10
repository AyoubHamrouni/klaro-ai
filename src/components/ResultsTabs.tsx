import { useState } from "react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ReadAlongText } from "@/components/ReadAlongText";
import {
  BookOpen,
  Brain,
  Headphones,
  Copy,
  Check,
  Printer,
  Sparkles,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
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

function SectionHeader({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="mt-0.5 p-2 rounded-xl bg-primary/10 border border-primary/15 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {step}
        </p>
        <h3 className="font-black text-lg tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export function ResultsTabs({ result, originalWordCount }: ResultsTabsProps) {
  const [copied, setCopied] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const summaryWordCount = result.summary.trim().split(/\s+/).length;
  const reductionPercent = Math.max(
    0,
    Math.min(100, Math.round((1 - result.wordCount / originalWordCount) * 100)),
  );
  const readingTimeSaved = Math.max(
    0,
    Math.round((originalWordCount - result.wordCount) / 250),
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
    toast({ title: "Copied", description: "Summary copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Lumina Summary</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.7; padding: 2.5rem; color: #0f172a; max-width: 820px; margin: 0 auto; }
            h1, h2 { color: #4f46e5; }
            .card { padding: 1rem 1.15rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 0.8rem 0; }
          </style>
        </head>
        <body>
          <h1>Lumina Summary</h1>
          <p>${result.summary}</p>
          <h2>Key Terms</h2>
          ${result.keyTerms
            .map(
              (term) => `
                <div class="card">
                  <strong>${term.term}</strong>
                  <div>${term.definition}</div>
                </div>
              `,
            )
            .join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <section className="glass-card rounded-[2rem] p-6 md:p-7 border-white/10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Step 2 of 4
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Your summary is ready.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Start here, then move into terms, practice, and visuals only when
              you need them.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider"
            >
              <Printer className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-9 opacity-80 hover:opacity-100"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-success" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Target className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-black text-primary">{reductionPercent}%</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Focus Gain
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <BookOpen className="w-5 h-5 text-accent mb-2" />
            <p className="text-2xl font-black text-accent">{readingTimeSaved}m</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Time Saved
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Brain className="w-5 h-5 text-warm mb-2" />
            <p className="text-2xl font-black text-warm">{result.keyTerms.length}</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Key Terms
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Sparkles className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-black text-foreground">{summaryWordCount}</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Summary Words
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-sm gap-3 mb-3">
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Content Optimization: {originalWordCount} → {result.wordCount} words
            </span>
            <Badge
              className={`${difficultyColors[result.difficulty_level as keyof typeof difficultyColors]} rounded-lg px-2 py-0.5 border-none shadow-sm`}
            >
              {result.difficulty_level}
            </Badge>
          </div>
          <Progress value={reductionPercent} className="h-2.5 bg-secondary/50" />
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-6 md:p-7 border-white/10 shadow-2xl">
        <SectionHeader
          step="Step 2a"
          title="Read the core summary"
          description="A first pass that tells you what matters without burying you in controls."
          icon={<BookOpen className="w-5 h-5 text-primary" />}
        />
        <div className="font-dyslexic text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {result.summary}
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-6 md:p-7 border-white/10 shadow-2xl">
        <SectionHeader
          step="Step 2b"
          title="Key terms"
          description="Use these as anchors for recall, flashcards, and the quiz."
          icon={<Brain className="w-5 h-5 text-warm" />}
        />
        {result.keyTerms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No key terms were extracted for this summary.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {result.keyTerms.map((item) => (
              <div
                key={item.term}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="font-black text-sm mb-1">{item.term}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card rounded-[2rem] p-6 md:p-7 border-white/10 shadow-2xl">
        <SectionHeader
          step="Step 2c"
          title="Listen and follow along"
          description="Audio and read-along are kept together so the user knows they serve the same goal."
          icon={<Headphones className="w-5 h-5 text-accent" />}
        />
        <div className="space-y-6">
          <AudioPlayer
            text={result.summary}
            onProgressChange={setAudioProgress}
            onPlayingChange={setAudioPlaying}
          />
          <ReadAlongText
            text={result.summary}
            progress={audioProgress}
            isPlaying={audioPlaying}
          />
        </div>
      </section>

    </motion.div>
  );
}
