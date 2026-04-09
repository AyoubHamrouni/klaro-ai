import { useEffect, useState, useRef } from "react";
import { StudyChat } from "../components/StudyChat";
import { TextInput } from "../components/TextInput";
import { ResultsTabs, SummaryResult } from "../components/ResultsTabs";
import { LoadingState } from "../components/LoadingState";
import { Header } from "../components/Header";
import { HistorySidebar } from "../components/HistorySidebar";
import { ReadingRuler } from "../components/ReadingRuler";
import { ActionPlan } from "../components/ActionPlan";
import { FocusTimer } from "../components/FocusTimer";
import { QuizInline } from "../components/QuizInline";
import { FlashcardMode } from "../components/FlashcardMode";
import { MindMap } from "../components/MindMap";
import { VisualInfographic } from "../components/VisualInfographic";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Sparkles,
  Brain,
  Target,
  BookOpen,
  ArrowLeft,
  Map,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMindmapLoading, setIsMindmapLoading] = useState(false);
  const [originalWordCount, setOriginalWordCount] = useState(0);
  const [historyCurrentId, setHistoryCurrentId] = useState<
    string | undefined
  >();
  const [focusMode, setFocusMode] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [dashboardView, setDashboardView] = useState<
    "study" | "practice" | "focus" | "visuals"
  >("study");
  const [practiceMode, setPracticeMode] = useState<"quiz" | "flashcards">(
    "quiz",
  );
  const [mindmapRequestedFor, setMindmapRequestedFor] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSummarize = async (text: string) => {
    setIsLoading(true);
    setResult(null);
    setIsMindmapLoading(false);
    setMindmapRequestedFor("");
    setOriginalWordCount(text.split(/\s+/).length);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/summarize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Summarization failed");
      }
      const data = await response.json();
      setResult(data);
      setDashboardView("study");

      const historyItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        result: data,
        originalText: text,
      };
      setHistoryCurrentId(historyItem.id);

      const saved = localStorage.getItem("study-history");
      const history = saved ? JSON.parse(saved) : [];
      localStorage.setItem(
        "study-history",
        JSON.stringify([historyItem, ...history]),
      );
      window.dispatchEvent(new Event("storage-update"));
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMindmap = async () => {
      if (
        !result ||
        result.mindmapData ||
        isMindmapLoading ||
        mindmapRequestedFor === result.summary ||
        dashboardView !== "visuals"
      ) {
        return;
      }

      setIsMindmapLoading(true);
      setMindmapRequestedFor(result.summary);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/mindmap`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: result.summary }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to generate mind map");
        }

        const data = await response.json();
        const mindmapData = data.mindmapData || data.mindmap || "";

        if (mindmapData) {
          setResult((prev) => (prev ? { ...prev, mindmapData } : prev));

          if (historyCurrentId) {
            const saved = localStorage.getItem("study-history");
            if (saved) {
              try {
                const history = JSON.parse(saved) as Array<{
                  id: string;
                  result: SummaryResult;
                }>;
                const updated = history.map((item) =>
                  item.id === historyCurrentId
                    ? {
                        ...item,
                        result: { ...item.result, mindmapData },
                      }
                    : item,
                );
                localStorage.setItem("study-history", JSON.stringify(updated));
                window.dispatchEvent(new Event("storage-update"));
              } catch {
                // Ignore malformed history data and keep the live result updated.
              }
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsMindmapLoading(false);
      }
    };

    fetchMindmap();
  }, [
    dashboardView,
    historyCurrentId,
    isMindmapLoading,
    mindmapRequestedFor,
    result,
  ]);

  const handleHistorySelect = (item: {
    result: SummaryResult;
    originalText: string;
    id: string;
  }) => {
    setResult(item.result);
    setOriginalWordCount(item.originalText.split(/\s+/).length);
    setHistoryCurrentId(item.id);
    setDashboardView("study");
  };

  const handleReset = () => {
    setResult(null);
    setOriginalWordCount(0);
    setHistoryCurrentId(undefined);
    setFocusMode(false);
    setShowRuler(false);
    setMindmapRequestedFor("");
    setIsMindmapLoading(false);
  };

  return (
    <div
      className={`min-h-[100dvh] relative overflow-hidden transition-colors duration-700 font-dyslexic ${focusMode ? "bg-black text-white" : "bg-background"}`}
    >
      {/* Background Layer */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${focusMode ? "opacity-5" : "opacity-100"}`}
      >
        {!result && (
          <div className="absolute inset-0 opacity-20 filter contrast-125 brightness-75">
            <img
              src="/branding/hero-bg.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Header
        onReset={handleReset}
        hasResult={!!result}
        onOpenVault={() => setIsVaultOpen(true)}
        showRuler={showRuler}
        setShowRuler={setShowRuler}
      />
      <HistorySidebar
        onSelect={handleHistorySelect}
        currentId={historyCurrentId}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
      />

      <main className="h-full pt-16 md:pt-20">
        <AnimatePresence mode="wait">
          {!result && !isLoading ? (
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
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/5 backdrop-blur-md border border-indigo-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-2xl shadow-indigo-500/10"
                >
                  <Sparkles className="w-4 h-4 fill-indigo-500/20" />
                  Lumina OS — Master Faster 3.0
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
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed opacity-80">
                  The Immersive Study Operating System designed for academic
                  excellence.
                </p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />
                <TextInput onSubmit={handleSummarize} isLoading={isLoading} />
              </div>
            </motion.section>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[80vh] flex items-center justify-center"
            >
              <LoadingState />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col md:flex-row gap-0 md:h-[calc(100dvh-5rem)] overflow-hidden"
            >
              {/* Study Navigation Rail (Desktop) / Bottom Bar (Mobile) */}
              <nav className="fixed bottom-0 left-0 right-0 z-50 md:relative md:w-20 md:h-full bg-white/5 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 p-2 md:p-4 flex md:flex-col justify-around md:justify-center items-center gap-4">
                <NavButton
                  active={dashboardView === "study"}
                  onClick={() => setDashboardView("study")}
                  icon={<BookOpen className="w-6 h-6" />}
                  label="Study"
                />
                <NavButton
                  active={isVaultOpen}
                  onClick={() => setIsVaultOpen(true)}
                  icon={<History className="w-6 h-6" />}
                  label="Vault"
                />
                <NavButton
                  active={dashboardView === "practice"}
                  onClick={() => setDashboardView("practice")}
                  icon={<Brain className="w-6 h-6" />}
                  label="Practice"
                />
                <NavButton
                  active={dashboardView === "visuals"}
                  onClick={() => setDashboardView("visuals")}
                  icon={<Map className="w-6 h-6" />}
                  label="Visuals"
                />
                <NavButton
                  active={dashboardView === "focus"}
                  onClick={() => setDashboardView("focus")}
                  icon={<Target className="w-6 h-6" />}
                  label="Focus"
                />
                <div className="hidden md:block flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </nav>

              {/* Main Workspace */}
              <div className="flex-1 overflow-y-auto custom-scrollbar md:p-6 pb-24 md:pb-6">
                <LayoutGroup>
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* View Switcher Content */}
                    <div className="lg:col-span-8 space-y-6">
                      <AnimatePresence mode="wait">
                        {dashboardView === "study" && (
                          <motion.div
                            key="study-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <ResultsTabs
                              result={result}
                              originalWordCount={originalWordCount}
                            />
                          </motion.div>
                        )}
                        {dashboardView === "practice" && (
                          <motion.div
                            key="practice-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h2 className="text-3xl font-black tracking-tight">
                                Practice Arena
                              </h2>
                              <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                                <Button
                                  variant={
                                    practiceMode === "quiz"
                                      ? "default"
                                      : "ghost"
                                  }
                                  size="sm"
                                  onClick={() => setPracticeMode("quiz")}
                                  className="rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-widest"
                                >
                                  Quiz
                                </Button>
                                <Button
                                  variant={
                                    practiceMode === "flashcards"
                                      ? "default"
                                      : "ghost"
                                  }
                                  size="sm"
                                  onClick={() => setPracticeMode("flashcards")}
                                  className="rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-widest"
                                >
                                  Flashcards
                                </Button>
                              </div>
                            </div>

                            <div className="glass-card rounded-[2.5rem] p-8 min-h-[500px]">
                              {practiceMode === "quiz" ? (
                                <QuizInline text={result.summary} />
                              ) : (
                                <div className="py-8">
                                  <FlashcardMode
                                    keyTerms={result.keyTerms}
                                    onClose={() => setDashboardView("study")}
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                        {dashboardView === "visuals" && (
                          <motion.div
                            key="visuals-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                              <Map className="w-7 h-7 text-indigo-400" />
                              Visual Studio
                            </h2>
                            {result?.mindmapData ? (
                              <MindMap mindmapData={result.mindmapData} />
                            ) : isMindmapLoading ? (
                              <div className="glass-card rounded-[2.5rem] p-10 border-white/10 text-center text-muted-foreground min-h-[420px] flex items-center justify-center">
                                <div className="space-y-3">
                                  <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                  <p className="font-bold">
                                    Building mind map...
                                  </p>
                                  <p className="text-xs opacity-60">
                                    The summary is ready. Visuals are loading in the background.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="glass-card rounded-[2.5rem] p-10 border-white/10 text-center text-muted-foreground">
                                <Map className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">
                                  No mind map generated
                                </p>
                                <p className="text-xs opacity-60 mt-1">
                                  Summarize more content to generate the visual
                                </p>
                              </div>
                            )}
                            <VisualInfographic
                              summary={result?.summary ?? ""}
                              originalWordCount={originalWordCount}
                              keyTerms={result?.keyTerms ?? []}
                              difficultyLevel={
                                result?.difficulty_level ?? "intermediate"
                              }
                            />
                          </motion.div>
                        )}
                        {dashboardView === "focus" && (
                          <motion.div
                            key="focus-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="glass-card rounded-[2rem] p-8 border-primary/20 bg-primary/5">
                              <h2 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-3">
                                <Target className="w-6 h-6 text-primary" />
                                Focused Study State
                              </h2>
                              <p className="text-muted-foreground mb-6 font-medium">
                                Entering Focus Mode will dim the background and
                                activate the focus mask to help you concentrate
                                on one thing at a time.
                              </p>
                              <Button
                                onClick={() => setFocusMode(!focusMode)}
                                variant={focusMode ? "default" : "outline"}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all"
                              >
                                {focusMode
                                  ? "Exit Focus Mode"
                                  : "Enter Focus State"}
                              </Button>
                            </div>
                            <FocusTimer />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Side Intelligence Panel (Always Visible on Desktop) */}
                    <aside className="lg:col-span-4 space-y-6 hidden lg:block">
                      <div className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl">
                        <ActionPlan
                          summary={result.summary}
                          initialTasks={result.tasks}
                        />
                      </div>
                      <FocusTimer />
                    </aside>
                  </div>
                </LayoutGroup>
              </div>

              {/* Study Companion (Always on but dimmable) */}
              <div
                className={`${focusMode ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity duration-700`}
              >
                <StudyChat context={result.summary} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Focus Masking Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-none z-[45] transition-all duration-1000" />
      )}

      <ReadingRuler isVisible={showRuler} />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-2xl transition-all duration-300 group ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground hover:bg-white/5"}`}
    >
      {icon}
      <span
        className={`absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block z-50`}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="nav-bg"
          className="absolute inset-0 bg-primary rounded-2xl -z-10"
        />
      )}
    </button>
  );
}
