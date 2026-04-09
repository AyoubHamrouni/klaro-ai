import { motion } from "framer-motion";
import { BarChart2, TrendingUp, BookOpen, Hash, Zap } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

export function VisualInfographic({
  summary,
  originalWordCount,
  keyTerms,
  difficultyLevel,
}: VisualInfographicProps) {
  const summaryWordCount = summary.trim().split(/\s+/).length;
  const compressionRatio = Math.round(
    (1 - summaryWordCount / originalWordCount) * 100,
  );
  const readingTimeMin = Math.max(1, Math.ceil(summaryWordCount / 200));
  const diffScore = difficultyToScore(difficultyLevel);

  // Radar data – 5 cognitive dimensions derived from the text stats
  const radarData = [
    {
      dimension: "Density",
      score: Math.min(100, Math.round((keyTerms.length / 8) * 100)),
    },
    { dimension: "Breadth", score: Math.min(100, compressionRatio) },
    { dimension: "Complexity", score: diffScore },
    {
      dimension: "Vocabulary",
      score: Math.min(100, Math.round((keyTerms.length / 5) * 80)),
    },
    {
      dimension: "Depth",
      score: Math.min(
        100,
        Math.round((summaryWordCount / Math.max(1, originalWordCount)) * 800),
      ),
    },
  ];

  const topTerms = keyTerms.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/20">
            <BarChart2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">
              Study Insights
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Cognitive load analysis
            </p>
          </div>
        </div>

        {/* Stat Cards */}
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

      {/* Radar + Key Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Radar */}
        <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Cognitive Profile
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="#6366f120" gridType="polygon" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.25}
                dot={{ fill: "#818cf8", r: 3 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #4f46e5",
                  borderRadius: 12,
                  fontSize: 11,
                }}
                formatter={(v: number) => [`${v}/100`, "Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Concept Bars */}
        <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Core Concepts
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
      </div>

      {/* Difficulty Progress Bar */}
      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
            Academic Complexity
          </p>
          <span
            className={`text-sm font-black ${getDifficultyColor(difficultyLevel)}`}
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
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground font-bold">
            Beginner
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">
            Expert
          </span>
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
  icon: React.ReactNode;
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
    <div className={`rounded-2xl p-3 border ${bg[color]} flex flex-col gap-1`}>
      <div className="opacity-70">{icon}</div>
      <p
        className={`font-black ${textSmall ? "text-sm" : "text-2xl"} leading-tight truncate`}
      >
        {value}
      </p>
      <p className="text-[10px] opacity-60 font-bold uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
