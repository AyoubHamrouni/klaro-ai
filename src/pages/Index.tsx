import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sparkles, FileText, Link2, BookOpen, Brain, Zap } from "lucide-react";
import { Header } from "../components/Header";
import { HistorySidebar } from "../components/HistorySidebar";
import { LoadingState } from "../components/LoadingState";
import { TextInput } from "../components/TextInput";
import type { SummaryResult } from "../components/ResultsTabs";
import { toast } from "@/hooks/use-toast";

const SESSION_STORAGE_KEY = "current-study-session";

export default function Index() {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">(
    "normal",
  );

  const darkMode = (resolvedTheme ?? theme) === "dark";
  const fontScaleClass = {
    normal: "",
    large: "text-[1.04rem]",
    xlarge: "text-[1.08rem]",
  }[fontSize];

  const handleSummarize = async (text: string) => {
    setIsLoading(true);
    setPendingPrompt(text);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Study bundle generation failed");
      }

      const result = (await response.json()) as SummaryResult;
      const historyItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        result,
        originalText: text,
      };

      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          historyCurrentId: historyItem.id,
          originalWordCount: text.split(/\s+/).length,
          result,
        }),
      );

      const saved = localStorage.getItem("study-history");
      const history = saved ? JSON.parse(saved) : [];
      localStorage.setItem(
        "study-history",
        JSON.stringify([historyItem, ...history]),
      );
      window.dispatchEvent(new Event("storage-update"));

      navigate("/study");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setPendingPrompt("");
    }
  };

  return (
    <div
      className={`min-h-[100dvh] relative overflow-x-hidden transition-colors duration-700 ${dyslexicFont ? "font-dyslexic" : ""} ${fontScaleClass} bg-background`}
    >
      <div className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000">
        <div className="absolute inset-0 opacity-20 filter contrast-125 brightness-75">
          <img
            src="/branding/hero-bg.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Header
        hasResult={false}
        onOpenVault={() => setIsVaultOpen(true)}
        showRuler={showRuler}
        setShowRuler={setShowRuler}
        dyslexicFont={dyslexicFont}
        setDyslexicFont={setDyslexicFont}
        fontSize={fontSize}
        setFontSize={setFontSize}
        darkMode={darkMode}
        setDarkMode={(nextValue) => setTheme(nextValue ? "dark" : "light")}
      />

      <HistorySidebar
        currentId={undefined}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onSelect={(item) => {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              historyCurrentId: item.id,
              originalWordCount: item.originalText.split(/\s+/).length,
              result: item.result,
            }),
          );
          navigate("/study");
        }}
      />

      <main className="min-h-[calc(100dvh-4rem)] pt-16 md:pt-20 pb-12">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-6 py-8 md:py-10"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <section className="glass-card rounded-[2rem] p-6 md:p-8 border-white/10 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Step 2 in progress
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                    Summarizing your input.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    The app is reading the content, extracting the core ideas,
                    and preparing the study session.
                  </p>
                  {pendingPrompt && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        Source in progress
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                        {pendingPrompt}
                      </p>
                    </div>
                  )}
                </section>
                <LoadingState />
              </div>
            </motion.div>
          ) : (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="container max-w-4xl mx-auto px-4 py-8 md:py-16"
            >
              <div className="text-center space-y-6 mb-12 relative">
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 backdrop-blur-md border border-primary/10 text-[11px] font-black uppercase tracking-[0.2em] text-primary shadow-2xl shadow-primary/10"
                >
                  <Sparkles className="w-4 h-4 fill-primary/20" />
                  Klaro AI Study Flow
                </motion.div>
                <div className="space-y-1">
                  <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40">
                    Focus. Learn.
                    <br />
                    <span className="text-primary italic-custom px-4">
                      Master.
                    </span>
                  </h1>
                </div>
                <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed opacity-80">
                  Import documents, share links, or paste text. Klaro AI
                  transforms any material into a structured study session with
                  summaries, visuals, and practice.
                </p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />
                <TextInput onSubmit={handleSummarize} isLoading={isLoading} />
              </div>

              {/* Features showcase */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto mt-20"
              >
                <div className="text-center mb-12">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Flexible Input Methods
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                    Study from anywhere
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Feature cards */}
                  <FeatureCard
                    icon={<FileText className="w-6 h-6" />}
                    title="Multiple Formats"
                    description="PDF, Word, PPT, CSV, TXT documents"
                    color="indigo"
                  />
                  <FeatureCard
                    icon={<Link2 className="w-6 h-6" />}
                    title="Shared Links"
                    description="Google Drive, Wikipedia, Medium, more"
                    color="violet"
                  />
                  <FeatureCard
                    icon={<BookOpen className="w-6 h-6" />}
                    title="Direct Text"
                    description="Paste or type content directly"
                    color="amber"
                  />
                  <FeatureCard
                    icon={<Brain className="w-6 h-6" />}
                    title="Smart Summaries"
                    description="AI-powered condensing with visuals"
                    color="emerald"
                  />
                  <FeatureCard
                    icon={<Zap className="w-6 h-6" />}
                    title="Interactive Visuals"
                    description="Mind maps and learning infographics"
                    color="rose"
                  />
                  <FeatureCard
                    icon={<Sparkles className="w-6 h-6" />}
                    title="Practice Tools"
                    description="Quizzes, flashcards, focus timers"
                    color="cyan"
                  />
                </div>
              </motion.div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto mt-20"
              >
                <div className="text-center mb-12">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    The Klaro Workflow
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                    From chaos to clarity
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-2">
                  {[
                    {
                      step: "1",
                      title: "Upload",
                      desc: "Documents, links, or text",
                    },
                    {
                      step: "2",
                      title: "Summarize",
                      desc: "AI extracts key ideas",
                    },
                    {
                      step: "3",
                      title: "Visualize",
                      desc: "Mind maps & infographics",
                    },
                    { step: "4", title: "Master", desc: "Quiz & flashcards" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      <div className="glass-card rounded-[2rem] p-6 border-white/10 shadow-xl text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 font-black text-white mb-3">
                          {item.step}
                        </div>
                        <h3 className="font-black text-lg mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      {idx < 3 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 translate-y-[-50%] text-primary/30">
                          →
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    indigo:
      "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400",
    violet:
      "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400",
    amber:
      "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400",
    rose: "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400",
    cyan: "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card rounded-[1.75rem] p-5 border transition-all duration-300 cursor-pointer ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <div className="mb-3">{icon}</div>
      <h4 className="font-black text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
}
