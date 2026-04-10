import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sparkles, TrendingUp, BookOpen, Hash, Zap } from "lucide-react";

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

function createPolygonPoints(values: number[]) {
  const centerX = 160;
  const centerY = 124;
  const radius = 72;
  const angleStep = (Math.PI * 2) / values.length;

  return values
    .map((value, index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      const r = radius * (value / 100);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      return `${x},${y}`;
    })
    .join(" ");
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

  const dimensions = [
    {
      label: "Density",
      score: clamp(Math.round((keyTerms.length / 8) * 100), 8, 100),
    },
    { label: "Compression", score: compressionRatio },
    { label: "Complexity", score: diffScore },
    {
      label: "Vocabulary",
      score: clamp(Math.round((keyTerms.length / 5) * 80), 10, 100),
    },
    {
      label: "Depth",
      score: clamp(
        Math.round((summaryWordCount / Math.max(1, originalWordCount)) * 800),
        10,
        100,
      ),
    },
  ];

  const radarPoints = createPolygonPoints(dimensions.map((item) => item.score));
  const radarGrid = [24, 48, 72];
  const topTerms = keyTerms.slice(0, 6);

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
              Study Pattern
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Overview of the session
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
            Cognitive Profile
          </p>
          <div className="rounded-[2rem] border border-white/10 bg-indigo-950/20 p-4 overflow-hidden">
            <svg viewBox="0 0 320 250" className="w-full h-[250px]">
              <defs>
                <linearGradient id="profileFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {[...radarGrid, 100].map((ring) => {
                const points = createPolygonPoints(
                  dimensions.map(() => ring),
                );
                return (
                  <polygon
                    key={ring}
                    points={points}
                    fill="none"
                    stroke="rgba(129,140,248,0.15)"
                    strokeWidth="1"
                  />
                );
              })}
              {dimensions.map((item, index) => {
                const angle = -Math.PI / 2 + (Math.PI * 2 * index) / dimensions.length;
                const x = 160 + Math.cos(angle) * 88;
                const y = 124 + Math.sin(angle) * 88;
                const labelX = 160 + Math.cos(angle) * 106;
                const labelY = 124 + Math.sin(angle) * 106;
                return (
                  <g key={item.label}>
                    <line
                      x1="160"
                      y1="124"
                      x2={x}
                      y2={y}
                      stroke="rgba(129,140,248,0.18)"
                      strokeWidth="1"
                    />
                    <circle cx={x} cy={y} r="3" fill="#818cf8" />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
              <polygon
                points={radarPoints}
                fill="url(#profileFill)"
                stroke="#818cf8"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {dimensions.map((item, index) => {
                const angle = -Math.PI / 2 + (Math.PI * 2 * index) / dimensions.length;
                const x = 160 + Math.cos(angle) * (72 * (item.score / 100));
                const y = 124 + Math.sin(angle) * (72 * (item.score / 100));
                return <circle key={`${item.label}-dot`} cx={x} cy={y} r="4" fill="#c084fc" />;
              })}
            </svg>
          </div>
        </div>

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
    <div className={`rounded-2xl border p-3 flex gap-3 items-start ${bg[color]}`}>
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
