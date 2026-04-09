import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActionPlanProps {
  summary: string;
  initialTasks?: string[];
}

export function ActionPlan({ summary, initialTasks }: ActionPlanProps) {
  const [tasks, setTasks] = useState<
    { id: number; text: string; completed: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/decompose`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary }),
        },
      );
      if (!response.ok) throw new Error("Failed to decompose tasks");
      const data = await response.json();
      setTasks(
        data.tasks.map((text: string, i: number) => ({
          id: i,
          text,
          completed: false,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [summary]);

  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(
        initialTasks.map((text: string, i: number) => ({
          id: i,
          text,
          completed: false,
        })),
      );
    } else if (summary) {
      fetchTasks();
    }
  }, [summary, initialTasks, fetchTasks]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <ListChecks className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-tight">
              Action Plan
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Checklist for focus
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

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-bold animate-pulse">
                Breaking down lesson...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Summarize a text to see your action plan.
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
                  className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                    task.completed
                      ? "bg-success/5 border-success/20 opacity-60"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {!isLoading && tasks.length > 0 && (
        <Button
          variant="ghost"
          onClick={fetchTasks}
          className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Regenerate Tasks
        </Button>
      )}
    </div>
  );
}
