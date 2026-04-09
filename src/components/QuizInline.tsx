import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  PartyPopper,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizInlineProps {
  text: string;
}

const encouragements = [
  "🔥 On fire!",
  "💪 Great job!",
  "🎯 Nailed it!",
  "⭐ Brilliant!",
  "🧠 Big brain!",
  "✨ Amazing!",
  "🚀 Unstoppable!",
];

export function QuizInline({ text }: QuizInlineProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/generate-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate quiz.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length === 0 && !isLoading && !error) {
      loadQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsChecking(true);
    const isCorrect =
      selectedOption === questions[currentIndex].correctAnswerIndex;
    if (isCorrect) {
      const newScore = score + 10 * (streak + 1);
      setScore(newScore);
      setStreak((s) => s + 1);
      setBestStreak((b) => Math.max(b, streak + 1));
      setShowScorePopup(true);
      setTimeout(() => setShowScorePopup(false), 1200);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecking(false);
    } else {
      setHasFinished(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedOption(null);
    setIsChecking(false);
    setHasFinished(false);
  };

  const progressPercent = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Generating quiz questions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col gap-3">
        <p className="font-medium">{error}</p>
        <Button variant="outline" onClick={loadQuiz} className="w-fit">
          Try Again
        </Button>
      </div>
    );
  }

  if (hasFinished) {
    const percentage = Math.round((score / (questions.length * 10)) * 100);
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8 space-y-6 relative"
      >
        {showConfetti && (
          <div className="confetti-container absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: [
                    "hsl(var(--primary))",
                    "hsl(var(--accent))",
                    "hsl(var(--warm))",
                    "hsl(var(--success))",
                  ][i % 4],
                }}
              />
            ))}
          </div>
        )}

        <div className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full">
          <Trophy className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Quiz Complete!</h2>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-primary">{score} pts</p>
          <p className="text-muted-foreground">Best streak: {bestStreak} 🔥</p>
        </div>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button onClick={handleRetry} size="lg">
            <PartyPopper className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  if (questions.length === 0) return null;

  const q = questions[currentIndex];

  return (
    <div className="space-y-6">
      {/* Score & Streak bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Q{currentIndex + 1}/{questions.length}
          </span>
          <div className="relative">
            <span className="font-bold text-lg text-primary">{score} pts</span>
            <AnimatePresence>
              {showScorePopup && (
                <motion.span
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -30 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute -top-6 left-0 text-sm font-bold text-success"
                >
                  +{10 * streak}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        {streak >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-warm font-bold"
          >
            <Flame className="w-5 h-5" />
            <span>{streak} streak!</span>
          </motion.div>
        )}
      </div>

      <Progress value={progressPercent} className="h-2" />

      <Card className="p-6 bg-accent/5 border-accent/20">
        <h3 className="text-xl font-semibold leading-relaxed mb-6 font-dyslexic">
          {q.question}
        </h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            const isCorrect = i === q.correctAnswerIndex;
            let cls =
              "w-full justify-start h-auto p-4 text-left font-medium transition-all";
            if (isChecking) {
              if (isCorrect) cls += " bg-success/20 border-success";
              else if (isSelected && !isCorrect)
                cls += " bg-destructive/20 border-destructive";
              else cls += " opacity-50";
            } else if (isSelected) {
              cls +=
                " bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";
            }
            return (
              <Button
                key={i}
                variant={
                  isChecking ? "outline" : isSelected ? "default" : "outline"
                }
                className={cls}
                onClick={() => !isChecking && setSelectedOption(i)}
                disabled={isChecking}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="flex-1 whitespace-pre-wrap font-dyslexic">
                    {opt}
                  </span>
                  {isChecking && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  )}
                  {isChecking && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence>
        {isChecking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              selectedOption === q.correctAnswerIndex
                ? "bg-success/15 border border-success/20"
                : "bg-warm/15 border border-warm/20"
            }`}
          >
            <p className="font-bold mb-1">
              {selectedOption === q.correctAnswerIndex
                ? encouragements[
                    Math.floor(Math.random() * encouragements.length)
                  ]
                : "Not quite!"}
            </p>
            <p className="text-sm opacity-90 leading-relaxed font-dyslexic">
              {q.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        {!isChecking ? (
          <Button
            size="lg"
            onClick={handleCheck}
            disabled={selectedOption === null}
            className="w-full sm:w-auto"
          >
            Check Answer
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="w-full sm:w-auto">
            {currentIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
