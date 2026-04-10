import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  
  // Dynamic Global Mouse Tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Parallax Scroll Physics
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], ["0%", "20%"]);
  const backgroundScale = useTransform(scrollY, [0, 1000], [1, 1.1]);

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
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/study-bundle`, {
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
      className={`relative w-full min-h-screen transition-colors duration-700 ${dyslexicFont ? "font-dyslexic" : ""} ${fontScaleClass} bg-background`}
    >
      {/* Background layer - Fixed and non-interactive */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          style={{ y: backgroundY, scale: backgroundScale }}
          className="absolute inset-0 opacity-30 filter contrast-125 brightness-[0.95]"
        >
          <img
            src="/branding/hero-bg.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Mouse Tracking Aura */}
        <motion.div
           animate={{
             x: mousePos.x - 300,
             y: mousePos.y - 300,
           }}
           transition={{ type: "spring", damping: 40, stiffness: 100, mass: 0.5 }}
           className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen"
        />

        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse mix-blend-screen" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse mix-blend-screen"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content layer - Relative and above background */}
      <div className="relative z-10">
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
          onReset={() => navigate("/")}
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

        <main className="w-full py-20 px-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-10"
              >
                <section className="glass-card rounded-[3rem] p-8 md:p-12 border-white/10 shadow-2xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-4">
                    Orchestration in progress
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                    Transforming your material into a study session.
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    Klaro AI is analyzing deep semantic structures, extracting key terms, and building your personalized learning roadmap.
                  </p>
                  {pendingPrompt && (
                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                        Source text snippet
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                        {pendingPrompt}
                      </p>
                    </div>
                  )}
                </section>
                <LoadingState />
              </motion.div>
            ) : (
              <motion.section
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-5xl mx-auto"
              >
                {/* Hero */}
                <div className="text-center space-y-8 mb-16 relative">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 text-[11px] font-black uppercase tracking-[0.3em] text-primary shadow-2xl shadow-primary/20"
                  >
                    <Sparkles className="w-4 h-4 fill-primary/30" />
                    Neuro-Inclusive Learning
                  </motion.div>
                  <div className="space-y-4">
                    <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40 pb-4">
                      Focus. Learn.
                      <br />
                      <span className="text-primary italic-custom px-6 inline-block">
                        Master.
                      </span>
                    </h1>
                  </div>
                  <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-tight opacity-90">
                    Import documents, share links, or paste text. Klaro AI
                    transforms any material into a high-clarity study session.
                  </p>
                </div>

                {/* Input Area */}
                <div className="relative group max-w-3xl mx-auto z-20 mb-32">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/40 to-accent/40 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-50 transition-all duration-1000" />
                  <TextInput onSubmit={handleSummarize} isLoading={isLoading} />
                </div>

                {/* Features showcase */}
                <div className="space-y-16 mb-32">
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-4">
                      The OS for your brain
                    </p>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                      Designed for how you learn
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                      icon={<FileText className="w-7 h-7" />}
                      title="Multiple Formats"
                      description="Process PDF, Word, PPT, CSV, and TXT documents with deep semantic extraction."
                      color="indigo"
                    />
                    <FeatureCard
                      icon={<Link2 className="w-7 h-7" />}
                      title="Shared Links"
                      description="Import content directly from Google Drive, Wikipedia, Medium, arXiv, and more."
                      color="violet"
                    />
                    <FeatureCard
                      icon={<BookOpen className="w-7 h-7" />}
                      title="Direct Input"
                      description="Paste or type content directly into the dyslexic-friendly text editor."
                      color="amber"
                    />
                    <FeatureCard
                      icon={<Brain className="w-7 h-7" />}
                      title="Smart Summaries"
                      description="AI-powered condensations that capture thesis, arguments, and actionable takeaways."
                      color="emerald"
                    />
                    <FeatureCard
                      icon={<Zap className="w-7 h-7" />}
                      title="Visual learning"
                      description="Interactive Mermaid concept maps and visual infographics generated instantly."
                      color="rose"
                    />
                    <FeatureCard
                      icon={<Sparkles className="w-7 h-7" />}
                      title="Recall Tools"
                      description="Adaptive quizzes, high-yield flashcards, and dedicated focus timers."
                      color="cyan"
                    />
                  </div>
                </div>

                {/* The Workflow */}
                <div className="space-y-16 pb-20">
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-4">
                      The Klaro Method
                    </p>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                      From chaos to clarity
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      {
                        step: "1",
                        title: "Upload",
                        desc: "Import documents, links, or raw text",
                      },
                      {
                        step: "2",
                        title: "Summarize",
                        desc: "Deep semantic analysis by AI",
                      },
                      {
                        step: "3",
                        title: "Visualize",
                        desc: "Maps & infographics for visuals",
                      },
                      { 
                        step: "4", 
                        title: "Master", 
                        desc: "Active recall with quiz & cards" 
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -8 }}
                        className="glass-card rounded-[2.5rem] p-8 border-white/10 shadow-2xl text-center relative group"
                      >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 font-black text-white text-xl mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                          {item.step}
                        </div>
                        <h3 className="font-black text-2xl mb-2 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
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
    indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400 shadow-indigo-500/5",
    violet: "border-violet-500/20 bg-violet-500/5 text-violet-400 shadow-violet-500/5",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400 shadow-amber-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/5",
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-400 shadow-rose-500/5",
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400 shadow-cyan-500/5",
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        boxShadow: "0 30px 60px -12px rgba(0,0,0,0.4)",
      }}
      className={`glass-card rounded-[2.5rem] p-8 border transition-all duration-500 cursor-default relative overflow-hidden group ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <motion.div 
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        className="mb-6 inline-block drop-shadow-2xl"
      >
        {icon}
      </motion.div>
      <h4 className="font-black text-lg mb-2 tracking-tight text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}
