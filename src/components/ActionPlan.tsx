import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
  Loader2,
  Mic,
  Headphones,
  Brain,
  Target,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SummaryResult } from "@/components/ResultsTabs";

type ActiveView = "study" | "practice" | "focus" | "visuals";

interface ActionPlanProps {
  result: SummaryResult | null;
  activeView: ActiveView;
  focusMode: boolean;
  voiceSupported: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  hint: string;
  icon: ReactNode;
  completed: boolean;
}

function buildChecklist(
  result: SummaryResult | null,
  activeView: ActiveView,
  focusMode: boolean,
  voiceSupported: boolean,
): ChecklistItem[] {
  const keyTermCount = result?.keyTerms?.length ?? 0;
  const hasMindmap = Boolean(result?.mindmapData);
  const summaryWords = result?.summary.trim().split(/\s+/).length ?? 0;
  const shortSummary = summaryWords < 140;

  return [
    {
      id: "summary",
      text: "Read the summary once and capture the main idea.",
      hint: "This anchors the rest of the session.",
      icon: <Sparkles className="w-4 h-4" />,
      completed: Boolean(result) && activeView === "study",
    },
    {
      id: "terms",
      text: `Review the first ${Math.min(5, Math.max(2, keyTermCount || 3))} key terms.`,
      hint: "Terms become flashcards or quick recall prompts.",
      icon: <Brain className="w-4 h-4" />,
      completed: keyTermCount > 0 && activeView === "study",
    },
    {
      id: "audio",
      text: shortSummary
        ? "Listen to the summary out loud for a second pass."
        : "Use audio to convert the summary into a lighter review pass.",
      hint: "Great before or after the quiz.",
      icon: <Headphones className="w-4 h-4" />,
      completed: activeView === "study" && summaryWords > 0,
    },
    {
      id: "practice",
      text: "Switch to Practice and answer a quiz or flashcard round.",
      hint: "This is where recall gets trained.",
      icon: <Layers className="w-4 h-4" />,
      completed: activeView === "practice",
    },
    {
      id: "visuals",
      text: hasMindmap
        ? "Open Visuals to inspect the mind map and infographic."
        : "Open Visuals once the mind map finishes loading.",
      hint: "Turn the summary into a spatial model.",
      icon: <Target className="w-4 h-4" />,
      completed: activeView === "visuals" && hasMindmap,
    },
    {
      id: "focus",
      text: voiceSupported
        ? "Use voice and Focus Mode for a distraction-free review."
        : "Enter Focus Mode for a distraction-free review.",
      hint: "Helps when the material feels dense.",
      icon: <Mic className="w-4 h-4" />,
      completed: focusMode,
    },
  ];
}

export function ActionPlan({
  result,
  activeView,
  focusMode,
  voiceSupported,
}: ActionPlanProps) {
  const [manualCompleted, setManualCompleted] = useState<Record<string, boolean>>(
    {},
  );

  const [isAnimating, setIsAnimating] = useState(false);

  const tasks = useMemo(() => {
    const checklist = buildChecklist(result, activeView, focusMode, voiceSupported);
    return checklist.map((item) => ({
      ...item,
      completed: item.completed || Boolean(manualCompleted[item.id]),
    }));
  }, [activeView, focusMode, manualCompleted, result, voiceSupported]);

  useEffect(() => {
    setManualCompleted({});
  }, [result?.summary]);

  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => setIsAnimating(false), 220);
    return () => clearTimeout(timeout);
  }, [activeView, focusMode, result?.summary]);

  const toggleTask = (id: string) => {
    setManualCompleted((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const nextTask = tasks.find((task) => !task.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <ListChecks className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-tight">
              Guided Checklist
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Auto-shaped around your study flow
            </p>
          </div>
        </div>
        {tasks.length > 0 && (
          <div className="text-right">
            <p className="text-sm font-black text-primary">
              {Math.round(progress)}%
            </p>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">
          Recommended next step
        </p>
        <p className="text-sm font-bold leading-snug">
          {nextTask?.text ?? "You are through the core workflow."}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {nextTask?.hint ?? "Everything essential is already in motion."}
        </p>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-bold animate-pulse">
                Waiting for a summary...
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => toggleTask(task.id)}
                  className={`group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                    task.completed
                      ? "bg-success/5 border-success/20 opacity-70"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  } ${isAnimating ? "shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" : ""}`}
                >
                  <div className="shrink-0 pt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {task.icon}
                      </span>
                      <span
                        className={`text-sm font-bold leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {task.text}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">{task.hint}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {result && (
        <Button
          variant="ghost"
          onClick={() => setManualCompleted({})}
          className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Reset Checklist
        </Button>
      )}
    </div>
  );
}
