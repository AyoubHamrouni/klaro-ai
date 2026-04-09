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
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export interface SummaryResult {
  summary: string;
  keyTerms: { term: string; definition: string }[];
  wordCount: number;
  difficulty_level: "beginner" | "intermediate" | "advanced";
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
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {reductionPercent}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                shorter
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
            <div>
              <p className="text-xl sm:text-2xl font-bold text-accent">
                {readingTimeSaved} min
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">saved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warm/10 to-warm/5 border-warm/20 shadow-sm backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-warm shrink-0" />
            <div>
              <p className="text-xl sm:text-2xl font-bold text-warm">
                {result.keyTerms.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                key terms
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Word count bar */}
      <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {originalWordCount} → {result.wordCount} words
            </span>
            <Badge className={difficultyColors[result.difficulty_level]}>
              {result.difficulty_level}
            </Badge>
          </div>
          <Progress value={reductionPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-11">
          <TabsTrigger value="summary" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4 hidden sm:block" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="w-4 h-4 hidden sm:block" />
            Key Terms
          </TabsTrigger>
          <TabsTrigger value="listen" className="gap-1.5 text-xs sm:text-sm">
            <Headphones className="w-4 h-4 hidden sm:block" />
            Listen
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="w-4 h-4 hidden sm:block" />
            Quiz
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-primary" /> Summary
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="font-dyslexic text-lg leading-relaxed">
                {result.summary}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Terms Tab */}
        <TabsContent value="terms">
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-warm" /> Key Terms
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setFlashcardMode(!flashcardMode)}
              >
                <Layers className="w-4 h-4 mr-1" />
                {flashcardMode ? "List View" : "Flashcards"}
              </Button>
            </CardHeader>
            <CardContent>
              {flashcardMode ? (
                <FlashcardMode
                  keyTerms={result.keyTerms}
                  onClose={() => setFlashcardMode(false)}
                />
              ) : (
                <Accordion type="multiple" className="w-full">
                  {result.keyTerms.map((item, i) => (
                    <AccordionItem key={i} value={`term-${i}`}>
                      <AccordionTrigger className="text-base font-semibold hover:no-underline">
                        {item.term}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="font-dyslexic text-base leading-relaxed text-muted-foreground">
                          {item.definition}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listen Tab */}
        <TabsContent value="listen">
          <div className="space-y-4">
            <AudioPlayer
              text={result.summary}
              onProgressChange={setAudioProgress}
              onPlayingChange={setAudioPlaying}
            />
            <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Headphones className="w-5 h-5 text-accent" /> Read Along
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReadAlongText
                  text={result.summary}
                  progress={audioProgress}
                  isPlaying={audioPlaying}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz">
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-primary" /> Knowledge
                Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuizInline text={result.summary} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
