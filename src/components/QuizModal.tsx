import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizModal({ text, isOpen, onClose }: QuizModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (isOpen && questions.length === 0 && !isLoading && !error) {
      loadQuiz();
    }
  }, [isOpen, questions.length, isLoading, error]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { text },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsChecking(true);
    const q = questions[currentIndex];
    if (selectedOption === q.correctAnswerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecking(false);
    } else {
      setHasFinished(true);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsChecking(false);
    setHasFinished(false);
    onClose();
  };

  // Reset state when strictly reopening
  useEffect(() => {
    if (!isOpen && !hasFinished) {
      // Keep state if backgrounded, but user can close and retain progress.
      // If we want a fresh quiz on reopen, we would reset here.
    }
  }, [isOpen]);

  const progressPercent = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl outline-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Knowledge Check
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse font-medium">
                Generating your quiz questions...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col gap-3">
              <p className="font-medium">{error}</p>
              <Button variant="outline" onClick={loadQuiz} className="w-fit">
                Try Again
              </Button>
            </div>
          )}

          {!isLoading && !error && questions.length > 0 && !hasFinished && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span>Score: {score}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <Card className="p-6 bg-accent/5 border-accent/20">
                <h3 className="text-xl font-semibold leading-relaxed mb-6">
                  {questions[currentIndex].question}
                </h3>

                <div className="space-y-3">
                  {questions[currentIndex].options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect =
                      i === questions[currentIndex].correctAnswerIndex;

                    let buttonClass =
                      "w-full justify-start h-auto p-4 text-left font-medium transition-all";

                    if (isChecking) {
                      if (isCorrect) {
                        buttonClass +=
                          " bg-success/20 border-success text-success-foreground hover:bg-success/20";
                      } else if (isSelected && !isCorrect) {
                        buttonClass +=
                          " bg-destructive/20 border-destructive text-destructive-foreground hover:bg-destructive/20";
                      } else {
                        buttonClass += " opacity-50 cursor-not-allowed";
                      }
                    } else if (isSelected) {
                      buttonClass +=
                        " bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";
                    }

                    return (
                      <Button
                        key={i}
                        variant={
                          isChecking
                            ? "outline"
                            : isSelected
                              ? "default"
                              : "outline"
                        }
                        className={buttonClass}
                        onClick={() => !isChecking && setSelectedOption(i)}
                        disabled={isChecking}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="flex-1 whitespace-pre-wrap">
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
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                      selectedOption ===
                      questions[currentIndex].correctAnswerIndex
                        ? "bg-success/15 text-success-foreground border border-success/20"
                        : "bg-warm/15 text-warm-foreground border border-warm/20"
                    }`}
                  >
                    <div className="flex-1 shadow-sm">
                      <p className="font-bold mb-1">
                        {selectedOption ===
                        questions[currentIndex].correctAnswerIndex
                          ? "Correct!"
                          : "Not quite!"}
                      </p>
                      <p className="text-sm opacity-90 leading-relaxed font-medium">
                        {questions[currentIndex].explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
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
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="w-full sm:w-auto"
                  >
                    {currentIndex < questions.length - 1
                      ? "Next Question"
                      : "Finish Quiz"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {hasFinished && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full mb-4">
                <Trophy className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <p className="text-xl text-muted-foreground">
                You scored{" "}
                <span className="font-bold text-foreground">{score}</span> out
                of {questions.length}
              </p>

              <div className="flex items-center justify-center gap-4 pt-6">
                <Button variant="outline" onClick={handleReset} size="lg">
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
