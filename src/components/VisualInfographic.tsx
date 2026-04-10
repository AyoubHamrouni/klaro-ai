import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  Lightbulb,
  RotateCcw,
  Timer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisualInfographicProps {
  summary: string;
  originalWordCount: number;
  keyTerms: Array<{ term: string; definition: string }>;
  difficultyLevel: string;
  mode?: "inline" | "expanded";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSentences(summary: string) {
  return summary
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildStudyPath(sentences: string[]) {
  return [
    sentences[0] || "Read the main claim first.",
    sentences[1] || "Sort the core concepts into groups.",
    sentences[2] || "Check the examples and supporting details.",
  ].map((text, index) => ({
    label: `Step ${index + 1}`,
    text: text.replace(/[.!?]+$/, ""),
  }));
}

function difficultyTone(level: string) {
  const value = level.toLowerCase();
  if (value.includes("beginner") || value.includes("easy"))
    return "Foundational";
  if (value.includes("advanced") || value.includes("expert")) return "Dense";
  return "Moderate";
}

function getConceptGroups(
  keyTerms: Array<{ term: string; definition: string }>,
) {
  const groups = [];

  for (let index = 0; index < keyTerms.length; index += 2) {
    const chunk = keyTerms.slice(index, index + 2);
    if (!chunk.length) continue;
    groups.push({
      title: chunk.map((item) => item.term).join(" + "),
      terms: chunk,
    });
  }

  return groups.slice(0, 3);
}

export function VisualInfographic({
  summary,
  originalWordCount,
  keyTerms,
  difficultyLevel,
  mode = "inline",
}: VisualInfographicProps) {
  const isExpanded = mode === "expanded";
  const tree = useMemo(() => {
    const extractedSentences = getSentences(summary);
    return {
      overview: extractedSentences[0] || summary,
      sentences: extractedSentences,
      path: buildStudyPath(extractedSentences),
      groups: getConceptGroups(keyTerms),
    };
  }, [summary, keyTerms]);

  const sentences = tree.sentences;
  const summaryWords = summary.trim().split(/\s+/).filter(Boolean).length;
  const reviewTime = Math.max(1, Math.ceil(summaryWords / 180));
  const compression = clamp(
    Math.round((1 - summaryWords / Math.max(1, originalWordCount)) * 100),
    0,
    100,
  );
  const [activeView, setActiveView] = useState<
    "overview" | "clusters" | "path"
  >("overview");
  const [selectedTerm, setSelectedTerm] = useState(keyTerms[0]?.term || "");
  const [scale, setScale] = useState(1);

  const focusedTerm =
    keyTerms.find((term) => term.term === selectedTerm) || keyTerms[0];

  const downloadDigest = () => {
    const content = `
VISUAL STUDY DIGEST
==================

MAIN IDEA:
${tree.overview}

KEY METRICS:
- Core Terms: ${keyTerms.length}
- Review Time: ${reviewTime} minutes
- Difficulty: ${difficultyTone(difficultyLevel)}
- Compression: ${compression}%

KEY TERMS:
${keyTerms.map((t) => `- ${t.term}: ${t.definition}`).join("\n")}

STUDY PATH:
${tree.path.map((s) => `${s.label}: ${s.text}`).join("\n")}

SUPPORTING IDEAS:
${sentences
  .slice(1, 4)
  .map((s, i) => `${i + 1}. ${s}`)
  .join("\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "klaro-ai-visual-digest.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isExpanded
          ? "h-full w-full flex flex-col rounded-[1.25rem] border border-white/10 bg-background p-4 md:p-5"
          : "glass-card rounded-[1.6rem] border-white/10 p-5 shadow-xl"
      }
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-[1rem] border border-accent/15 bg-accent/10 p-2.5">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">Visual Digest</h3>
            <p className="text-sm text-muted-foreground">
              Focus on one view at a time to absorb the concepts clearly.
            </p>
          </div>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setScale((value) => Math.max(0.9, value - 0.05))}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs font-bold text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setScale((value) => Math.min(1.15, value + 0.05))}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => {
                setActiveView("overview");
                setSelectedTerm(keyTerms[0]?.term || "");
                setScale(1);
              }}
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={downloadDigest}
              title="Download digest"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Core terms" value={String(keyTerms.length)} />
          <StatCard label="Review time" value={`${reviewTime} min`} />
          <StatCard
            label="Difficulty"
            value={difficultyTone(difficultyLevel)}
          />
          <StatCard label="Compression" value={`${compression}%`} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "overview", label: "Overview" },
          { id: "clusters", label: "Concept Clusters" },
          { id: "path", label: "Study Path" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              setActiveView(item.id as "overview" | "clusters" | "path")
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
              activeView === item.id
                ? "border-primary/20 bg-primary text-primary-foreground"
                : "border-border/80 bg-white/60 text-muted-foreground hover:bg-secondary dark:bg-white/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-[1.4rem] border border-border/80 bg-gradient-to-br from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div
            className={`grid gap-3 md:gap-4 w-full auto-rows-max px-1 ${
              isExpanded
                ? "grid-cols-1 lg:grid-cols-[1fr_300px]"
                : "grid-cols-1 lg:grid-cols-[1fr_280px]"
            }`}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <section className="rounded-[1.35rem] border border-border/80 bg-background/70 p-4">
              {activeView === "overview" && (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Main idea
                    </p>
                    <h4 className="mt-2 text-2xl font-black tracking-tight leading-tight">
                      {tree.overview.split(/[\n.]/)[0] || "Overview"}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {tree.overview}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {keyTerms.slice(0, 6).map((term) => (
                      <button
                        key={term.term}
                        type="button"
                        onClick={() => setSelectedTerm(term.term)}
                        className={`rounded-[1rem] border p-3 text-left transition-all ${
                          selectedTerm === term.term
                            ? "border-primary/20 bg-primary/10"
                            : "border-border/80 bg-white/60 hover:bg-secondary dark:bg-white/5"
                        }`}
                      >
                        <p className="text-sm font-black">{term.term}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {term.definition}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeView === "clusters" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Concept clusters
                    </p>
                    <h4 className="mt-2 text-lg font-black">
                      Group related ideas together
                    </h4>
                  </div>

                  <div className="grid gap-3">
                    {tree.groups.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-[1rem] border border-border/80 bg-white/60 p-3 dark:bg-white/5"
                      >
                        <p className="text-sm font-black">{group.title}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {group.terms.map((term) => (
                            <button
                              key={term.term}
                              type="button"
                              onClick={() => setSelectedTerm(term.term)}
                              className={`rounded-[0.75rem] border p-2 text-left text-xs transition-all ${
                                selectedTerm === term.term
                                  ? "border-primary/20 bg-primary/10"
                                  : "border-border/80 bg-background/70 hover:bg-secondary"
                              }`}
                            >
                              <p className="font-black">{term.term}</p>
                              <p className="mt-0.5 text-muted-foreground line-clamp-2">
                                {term.definition}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === "path" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Study path
                    </p>
                    <h4 className="mt-2 text-lg font-black">
                      Follow this sequence to learn efficiently
                    </h4>
                  </div>

                  <div className="grid gap-3">
                    {tree.path.map((step) => (
                      <div
                        key={step.label}
                        className="rounded-[1rem] border border-border/80 bg-white/60 p-3 dark:bg-white/5"
                      >
                        <div className="flex items-start gap-2">
                          <div className="rounded-full bg-primary/10 p-1.5 flex-shrink-0 mt-0.5">
                            <ArrowRight className="h-3 w-3 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                              {step.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-snug">
                              {step.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="rounded-[1.35rem] border border-border/80 bg-background/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Active term
              </p>
              {focusedTerm && (
                <div className="mt-3">
                  <h4 className="mt-2 text-lg font-black leading-tight">
                    {focusedTerm.term}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {focusedTerm.definition}
                  </p>
                </div>
              )}

              <div className="mt-4 border-t border-border/70 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Key metrics
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Terms</span>
                    <span className="font-black">{keyTerms.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-black">{reviewTime} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-black">
                      {difficultyTone(difficultyLevel)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Compression</span>
                    <span className="font-black">{compression}%</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/60 px-4 py-3 dark:bg-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-snug">{value}</p>
    </div>
  );
}
