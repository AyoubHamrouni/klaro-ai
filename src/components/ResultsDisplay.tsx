import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/AudioPlayer";
import { QuizModal } from "@/components/QuizModal";
import { BookOpen, Brain, BarChart3, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export interface SummaryResult {
  summary: string;
  keyTerms: { term: string; definition: string }[];
  wordCount: number;
  difficulty_level: "beginner" | "intermediate" | "advanced";
}

interface ResultsDisplayProps {
  result: SummaryResult;
  originalWordCount: number;
}

const difficultyColors = {
  beginner: "bg-success text-success-foreground",
  intermediate: "bg-warm text-warm-foreground",
  advanced: "bg-destructive text-destructive-foreground",
};

export function ResultsDisplay({
  result,
  originalWordCount,
}: ResultsDisplayProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const reductionPercent = Math.round(
    (1 - result.wordCount / originalWordCount) * 100,
  );
  const readingTimeSaved = Math.round(
    (originalWordCount - result.wordCount) / 250,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-primary">
                {reductionPercent}%
              </p>
              <p className="text-sm text-muted-foreground">shorter</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-accent">
                {readingTimeSaved} min
              </p>
              <p className="text-sm text-muted-foreground">saved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warm/5 border-warm/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Brain className="w-8 h-8 text-warm" />
            <div>
              <p className="text-2xl font-bold text-warm">
                {result.keyTerms.length}
              </p>
              <p className="text-sm text-muted-foreground">key terms</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Word count comparison */}
      <Card>
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

      {/* Summary */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-dyslexic text-lg leading-relaxed">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      {/* Audio Player */}
      <AudioPlayer text={result.summary} />

      {/* Key Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-5 h-5 text-warm" />
            Key Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Gamified Quiz Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Alert className="bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-center gap-4 py-6 px-6">
          <div className="flex bg-primary/10 p-3 rounded-full shrink-0">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <AlertTitle className="text-xl mb-1">
              Ready to test your knowledge?
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-base">
              Take a quick gamified quiz generated securely from this summary to
              reinforce your learning!
            </AlertDescription>
          </div>
          <Button
            size="lg"
            className="shrink-0 w-full sm:w-auto"
            onClick={() => setIsQuizOpen(true)}
          >
            Start Quiz
          </Button>
        </Alert>
      </motion.div>

      <QuizModal
        text={result.summary}
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />
    </motion.div>
  );
}
