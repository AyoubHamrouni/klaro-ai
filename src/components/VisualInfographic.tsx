import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  Hash,
  Zap,
  Layers,
  Lightbulb,
} from "lucide-react";

interface VisualInfographicProps {
  summary: string;
  originalWordCount: number;
  keyTerms: Array<{ term: string; definition: string }>;
  difficultyLevel: string;
}

function difficultyToScore(level: string): number {
  const l = level.toLowerCase();
  if (l.includes("beginner") || l.includes("easy")) return 25;
  if (l.includes("intermediate") || l.includes("moderate")) return 55;
  if (l.includes("advanced") || l.includes("hard")) return 80;
  if (l.includes("expert")) return 95;
  return 50;
}

function getDifficultyColor(level: string): string {
  const score = difficultyToScore(level);
  if (score < 30) return "text-emerald-400";
  if (score < 65) return "text-amber-400";
  return "text-rose-400";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function extractMainTopics(
  summary: string,
  keyTerms: Array<{ term: string; definition: string }>,
): string[] {
  const sentences = summary.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const topics: string[] = [];

  // Get first 3 key terms as primary topics
  keyTerms.slice(0, 3).forEach((kt) => {
    topics.push(kt.term);
  });

  // Add concepts from first few sentences
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    const words = firstSentence.split(/\s+/);
    if (words.length > 0) {
      const topic = words.slice(0, Math.min(3, words.length)).join(" ");
      if (!topics.includes(topic)) topics.push(topic);
    }
  }

  return topics.slice(0, 5);
}

export function VisualInfographic({
  summary,
  originalWordCount,
  keyTerms,
  difficultyLevel,
}: VisualInfographicProps) {
  const summaryWordCount = summary.trim().split(/\s+/).length;
  const compressionRatio = clamp(
    Math.round((1 - summaryWordCount / Math.max(1, originalWordCount)) * 100),
    0,
    100,
  );
  const readingTimeMin = Math.max(1, Math.ceil(summaryWordCount / 200));
  const diffScore = difficultyToScore(difficultyLevel);
  const mainTopics = extractMainTopics(summary, keyTerms);
  const topTerms = keyTerms.slice(0, 6);
  const studySequence = [
    "Read through once for context.",
    "Highlight key terms you'll study.",
    "Use flashcards to anchor knowledge.",
    "Test yourself with the built-in quiz.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="space-y-5"
    >
      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">
              Learning Overview
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Content structure and study metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Hash className="w-4 h-4" />}
            label="Key Concepts"
            value={String(keyTerms.length)}
            color="violet"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Compression"
            value={`${compressionRatio}%`}
            color="indigo"
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Read Time"
            value={`${readingTimeMin}m`}
            color="cyan"
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Difficulty"
            value={difficultyLevel}
            color="amber"
            textSmall
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Content Learning Flow
          </p>
          <div className="space-y-4">
            {mainTopics.length > 0 ? (
              mainTopics.map((topic, index) => (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-white">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-bold text-sm">{topic}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Topics will appear here
              </p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Difficulty & Scope
          </p>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Content Complexity</span>
                <span
                  className={`text-xs font-black ${getDifficultyColor(difficultyLevel)}`}
                >
                  {difficultyLevel}
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${diffScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      diffScore < 35
                        ? "linear-gradient(90deg, #34d399, #059669)"
                        : diffScore < 65
                          ? "linear-gradient(90deg, #fbbf24, #d97706)"
                          : "linear-gradient(90deg, #f87171, #dc2626)",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Content Reduction</span>
                <span className="text-xs font-bold text-primary">
                  {compressionRatio}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compressionRatio}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Top Terms to Master
        </p>
        <div className="space-y-3">
          {topTerms.map((t, i) => {
            const barW = Math.max(20, 100 - i * 12);
            return (
              <div key={t.term}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold truncate max-w-[70%]">
                    {t.term}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    #{i + 1}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barW}%` }}
                    transition={{
                      delay: 0.1 + i * 0.05,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{
                      background: `hsl(${250 - i * 15}, 70%, ${55 + i * 3}%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {keyTerms.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No key terms extracted yet.
            </p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Recommended Study Path
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {studySequence.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Step {index + 1}
              </p>
              <p className="text-sm font-bold leading-relaxed">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
              Learning Tip
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              This material has <strong>{keyTerms.length} key concepts</strong>{" "}
              to master. Focus on understanding these before diving into
              details. The mind map on the left shows how these concepts
              connect.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  textSmall = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  textSmall?: boolean;
}) {
  const bg: Record<string, string> = {
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div
      className={`rounded-2xl border p-3 flex gap-3 items-start ${bg[color]}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p
          className={`font-black leading-tight ${textSmall ? "text-xs" : "text-sm"}`}
        >
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-widest opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}
