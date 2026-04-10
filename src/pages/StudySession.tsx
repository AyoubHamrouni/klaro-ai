import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  ChartColumn,
  Compass,
  Eye,
  History,
  Lightbulb,
  Map,
  Target,
} from "lucide-react";
import { Header } from "../components/Header";
import { HistorySidebar } from "../components/HistorySidebar";
import { ReadingRuler } from "../components/ReadingRuler";
import { ActionPlan } from "../components/ActionPlan";
import { FocusTimer } from "../components/FocusTimer";
import { QuizInline } from "../components/QuizInline";
import { FlashcardMode } from "../components/FlashcardMode";
import { MindMap } from "../components/MindMap";
import { VisualInfographic } from "../components/VisualInfographic";
import { ResultsTabs, type SummaryResult } from "../components/ResultsTabs";
import { StudyChat } from "../components/StudyChat";
import { LoadingState } from "../components/LoadingState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const SESSION_STORAGE_KEY = "current-study-session";

interface StoredSession {
  historyCurrentId?: string;
  originalWordCount: number;
  result: SummaryResult;
}

type DashboardView = "study" | "practice" | "visuals" | "focus";
type VisualInspector = "mindmap" | "infographic" | null;

export default function StudySession() {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [session, setSession] = useState<StoredSession | null>(() => {
    if (typeof window === "undefined") return null;

    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as StoredSession;
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  });
  const [isSessionResolved, setIsSessionResolved] = useState(
    typeof window === "undefined" ? false : true,
  );
  const [isMindmapLoading, setIsMindmapLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>("study");
  const [practiceMode, setPracticeMode] = useState<"quiz" | "flashcards">(
    "quiz",
  );
  const [mindmapRequestedFor, setMindmapRequestedFor] = useState("");
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">(
    "normal",
  );
  const [visualInspector, setVisualInspector] =
    useState<VisualInspector>(null);

  const darkMode = (resolvedTheme ?? theme) === "dark";
  const fontScaleClass = {
    normal: "",
    large: "text-[1.04rem]",
    xlarge: "text-[1.08rem]",
  }[fontSize];
  const voiceSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (session) {
      setIsSessionResolved(true);
      return;
    }

    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) {
      setIsSessionResolved(true);
      navigate("/", { replace: true });
      return;
    }

    try {
      setSession(JSON.parse(saved) as StoredSession);
      setIsSessionResolved(true);
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setIsSessionResolved(true);
      navigate("/", { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    if (!session) return;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const fetchMindmap = async () => {
      if (
        !session?.result ||
        session.result.mindmapData ||
        isMindmapLoading ||
        mindmapRequestedFor === session.result.summary
      ) {
        return;
      }

      setIsMindmapLoading(true);
      setMindmapRequestedFor(session.result.summary);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/mindmap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: session.result.summary }),
        });

        if (!response.ok) throw new Error("Failed to generate mind map");

        const data = await response.json();
        const mindmapData = data.mindmapData || data.mindmap || "";
        if (!mindmapData) return;

        setSession((prev) =>
          prev
            ? {
                ...prev,
                result: { ...prev.result, mindmapData },
              }
            : prev,
        );

        if (session.historyCurrentId) {
          const savedHistory = localStorage.getItem("study-history");
          if (savedHistory) {
            try {
              const history = JSON.parse(savedHistory) as Array<{
                id: string;
                result: SummaryResult;
              }>;
              const updated = history.map((item) =>
                item.id === session.historyCurrentId
                  ? {
                      ...item,
                      result: { ...item.result, mindmapData },
                    }
                  : item,
              );
              localStorage.setItem("study-history", JSON.stringify(updated));
              window.dispatchEvent(new Event("storage-update"));
            } catch {
              // Keep the active session alive even if stored history is malformed.
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsMindmapLoading(false);
      }
    };

    void fetchMindmap();
  }, [isMindmapLoading, mindmapRequestedFor, session]);

  if (!isSessionResolved || !session) {
    return (
      <div className="min-h-[100dvh] bg-background pt-16 md:pt-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <LoadingState />
        </div>
      </div>
    );
  }

  const handleReset = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    navigate("/");
  };

  const reductionPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (1 -
          session.result.wordCount / Math.max(1, session.originalWordCount)) *
          100,
      ),
    ),
  );
  const readingTimeMin = Math.max(
    1,
    Math.ceil(session.result.summary.trim().split(/\s+/).length / 200),
  );

  return (
    <div
      className={`min-h-[100dvh] relative overflow-x-hidden transition-colors duration-700 ${dyslexicFont ? "font-dyslexic" : ""} ${fontScaleClass} ${focusMode ? "bg-black text-white" : "bg-background"}`}
    >
      <div
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${focusMode ? "opacity-5" : "opacity-100"}`}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Header
        onReset={handleReset}
        hasResult
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
        currentId={session.historyCurrentId}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onSelect={(item) => {
          setSession({
            historyCurrentId: item.id,
            originalWordCount: item.originalText.split(/\s+/).length,
            result: item.result,
          });
          setDashboardView("study");
          setPracticeMode("quiz");
        }}
      />

      <main className="min-h-[calc(100dvh-4rem)] pt-16 md:pt-20 pb-24 md:pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4 md:px-6 py-6 md:py-8"
        >
          <div className="max-w-6xl mx-auto space-y-6">
            <section className="glass-card rounded-[2rem] p-5 md:p-6 border-white/10 shadow-2xl">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Active study workspace
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                    One task at a time, one tab at a time.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The workspace is now segmented for dyslexia and ADHD use:
                    summary first, practice on demand, visuals in an inspectable
                    surface, and focus tools in their own lane.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:min-w-[420px]">
                  <MetricTile
                    icon={<ChartColumn className="w-4 h-4" />}
                    label="Compression"
                    value={`${reductionPercent}%`}
                  />
                  <MetricTile
                    icon={<Brain className="w-4 h-4" />}
                    label="Key Terms"
                    value={String(session.result.keyTerms.length)}
                  />
                  <MetricTile
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Read Time"
                    value={`${readingTimeMin}m`}
                  />
                  <MetricTile
                    icon={<History className="w-4 h-4" />}
                    label="Session"
                    value="Ready"
                  />
                </div>
              </div>
            </section>

            <Tabs
              value={dashboardView}
              onValueChange={(value) => setDashboardView(value as DashboardView)}
              className="space-y-6"
            >
              <TabsList className="h-auto w-full grid grid-cols-2 md:grid-cols-4 gap-2 rounded-[1.75rem] border border-white/10 bg-white/5 p-2">
                <TabsTrigger
                  value="study"
                  className="rounded-[1.15rem] px-4 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="practice"
                  className="rounded-[1.15rem] px-4 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Practice
                </TabsTrigger>
                <TabsTrigger
                  value="visuals"
                  className="rounded-[1.15rem] px-4 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Visuals
                </TabsTrigger>
                <TabsTrigger
                  value="focus"
                  className="rounded-[1.15rem] px-4 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Focus
                </TabsTrigger>
              </TabsList>

              <TabsContent value="study" className="mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                  <ResultsTabs
                    result={session.result}
                    originalWordCount={session.originalWordCount}
                  />
                  <div className="space-y-6 xl:sticky xl:top-24">
                    <SidebarCard
                      icon={<Compass className="w-5 h-5 text-primary" />}
                      title="Guided checklist"
                      label="Next step"
                    >
                      <ActionPlan
                        result={session.result}
                        activeView={dashboardView}
                        focusMode={focusMode}
                        voiceSupported={voiceSupported}
                      />
                    </SidebarCard>
                    <SidebarCard
                      icon={<ChartColumn className="w-5 h-5 text-cyan-400" />}
                      title="Session analytics"
                      label="Overview"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <MetricTile
                          icon={<BookOpen className="w-4 h-4" />}
                          label="Original"
                          value={`${session.originalWordCount}`}
                        />
                        <MetricTile
                          icon={<ChartColumn className="w-4 h-4" />}
                          label="Summary"
                          value={`${session.result.wordCount}`}
                        />
                        <MetricTile
                          icon={<Lightbulb className="w-4 h-4" />}
                          label="Difficulty"
                          value={session.result.difficulty_level}
                        />
                        <MetricTile
                          icon={<Map className="w-4 h-4" />}
                          label="Visuals"
                          value={session.result.mindmapData ? "Ready" : "Soon"}
                        />
                      </div>
                    </SidebarCard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="practice" className="mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                  <section className="glass-card rounded-[2rem] p-6 border-white/10 shadow-2xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                          Practice arena
                        </p>
                        <h3 className="font-black text-xl tracking-tight">
                          Active recall without extra noise.
                        </h3>
                      </div>
                      <div className="flex bg-white/10 p-1 rounded-full border border-white/10">
                        <Button
                          variant={practiceMode === "quiz" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setPracticeMode("quiz")}
                          className="rounded-full h-8 px-4 font-bold text-[10px] uppercase tracking-widest"
                        >
                          Quiz
                        </Button>
                        <Button
                          variant={
                            practiceMode === "flashcards" ? "default" : "ghost"
                          }
                          size="sm"
                          onClick={() => setPracticeMode("flashcards")}
                          className="rounded-full h-8 px-4 font-bold text-[10px] uppercase tracking-widest"
                        >
                          Flashcards
                        </Button>
                      </div>
                    </div>

                    {practiceMode === "quiz" ? (
                      <QuizInline text={session.result.summary} />
                    ) : (
                      <FlashcardMode
                        keyTerms={session.result.keyTerms}
                        onClose={() => setPracticeMode("quiz")}
                      />
                    )}
                  </section>

                  <div className="space-y-6 xl:sticky xl:top-24">
                    <SidebarCard
                      icon={<Target className="w-5 h-5 text-primary" />}
                      title="Why this tab exists"
                      label="Structure"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Practice is separated from the summary so recall work
                        starts only when the learner is ready for it.
                      </p>
                    </SidebarCard>
                    <SidebarCard
                      icon={<Compass className="w-5 h-5 text-primary" />}
                      title="Checklist"
                      label="Progress"
                    >
                      <ActionPlan
                        result={session.result}
                        activeView={dashboardView}
                        focusMode={focusMode}
                        voiceSupported={voiceSupported}
                      />
                    </SidebarCard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visuals" className="mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                  <div className="space-y-6">
                    <section className="glass-card rounded-[2rem] p-6 border-white/10 shadow-2xl">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                            Visual learning
                          </p>
                          <h3 className="font-black text-xl tracking-tight">
                            Inspect the concept map or the study infographic.
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                            Visuals are now split into dedicated inspectable
                            surfaces instead of being buried in the main scroll.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <VisualPreviewCard
                          title="Mind map"
                          description={
                            session.result.mindmapData
                              ? "Explore the concept branches, zoom in, and inspect relationships."
                              : "The mind map is being prepared in the background."
                          }
                          status={
                            session.result.mindmapData
                              ? "Ready to inspect"
                              : isMindmapLoading
                                ? "Generating"
                                : "Waiting"
                          }
                          icon={<Map className="w-5 h-5 text-indigo-400" />}
                          onInspect={() => setVisualInspector("mindmap")}
                          disabled={!session.result.mindmapData}
                        >
                          <div className="rounded-[1.5rem] border border-white/10 bg-indigo-950/20 p-5 min-h-[220px] flex items-center justify-center text-center">
                            {session.result.mindmapData ? (
                              <div className="space-y-2">
                                <p className="text-lg font-black">Concept map ready</p>
                                <p className="text-sm text-muted-foreground">
                                  Open the inspect view for full zoom and navigation.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-lg font-black">Mind map loading</p>
                                <p className="text-sm text-muted-foreground">
                                  The summary is ready. The visual graph is still building.
                                </p>
                              </div>
                            )}
                          </div>
                        </VisualPreviewCard>

                        <VisualPreviewCard
                          title="Infographic"
                          description="Turn the summary into a cleaner visual digest with study metrics and concept emphasis."
                          status="Ready to inspect"
                          icon={<ChartColumn className="w-5 h-5 text-cyan-400" />}
                          onInspect={() => setVisualInspector("infographic")}
                        >
                          <div className="rounded-[1.5rem] border border-white/10 bg-cyan-950/20 p-5 min-h-[220px]">
                            <div className="grid grid-cols-2 gap-3">
                              <MetricTile
                                icon={<Brain className="w-4 h-4" />}
                                label="Concepts"
                                value={String(session.result.keyTerms.length)}
                              />
                              <MetricTile
                                icon={<BookOpen className="w-4 h-4" />}
                                label="Read Time"
                                value={`${readingTimeMin}m`}
                              />
                              <MetricTile
                                icon={<ChartColumn className="w-4 h-4" />}
                                label="Compression"
                                value={`${reductionPercent}%`}
                              />
                              <MetricTile
                                icon={<Lightbulb className="w-4 h-4" />}
                                label="Difficulty"
                                value={session.result.difficulty_level}
                              />
                            </div>
                          </div>
                        </VisualPreviewCard>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6 xl:sticky xl:top-24">
                    <SidebarCard
                      icon={<Eye className="w-5 h-5 text-primary" />}
                      title="Inspect mode"
                      label="Visual behavior"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Use inspect to isolate the visual, remove surrounding
                        clutter, zoom in, and study it as its own artifact.
                      </p>
                    </SidebarCard>
                    <SidebarCard
                      icon={<Compass className="w-5 h-5 text-primary" />}
                      title="Checklist"
                      label="Progress"
                    >
                      <ActionPlan
                        result={session.result}
                        activeView={dashboardView}
                        focusMode={focusMode}
                        voiceSupported={voiceSupported}
                      />
                    </SidebarCard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="focus" className="mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                  <section className="space-y-6">
                    <div className="glass-card rounded-[2rem] p-6 border-white/10 shadow-2xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                          <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Focus tools
                          </p>
                          <h3 className="font-black text-xl tracking-tight">
                            Timer and low-noise mode live together here.
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            The Pomodoro timer and focus overlay are grouped so
                            the learner does not have to hunt for regulation
                            tools while studying.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-stretch">
                      <FocusTimer />
                      <div className="glass-card rounded-[2rem] p-6 border-white/10 shadow-2xl flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                              Focus state
                            </p>
                            <h3 className="font-black text-lg tracking-tight">
                              Reduce background noise when the material feels dense.
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            This keeps the accessibility tools in one place:
                            focus mask, reading ruler, timer, and voice support.
                          </p>
                        </div>
                        <Button
                          onClick={() => setFocusMode(!focusMode)}
                          variant={focusMode ? "default" : "outline"}
                          className="mt-6 w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]"
                        >
                          {focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                        </Button>
                      </div>
                    </div>
                  </section>

                  <div className="space-y-6 xl:sticky xl:top-24">
                    <SidebarCard
                      icon={<Compass className="w-5 h-5 text-primary" />}
                      title="Checklist"
                      label="Progress"
                    >
                      <ActionPlan
                        result={session.result}
                        activeView={dashboardView}
                        focusMode={focusMode}
                        voiceSupported={voiceSupported}
                      />
                    </SidebarCard>
                    <SidebarCard
                      icon={<Lightbulb className="w-5 h-5 text-amber-400" />}
                      title="Why this placement works"
                      label="ADHD support"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Focus tools are no longer buried under the summary. They
                        now sit in a dedicated tab to reduce switching cost.
                      </p>
                    </SidebarCard>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div
              className={`${focusMode ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity duration-700`}
            >
              <StudyChat context={session.result.summary} />
            </div>
          </div>
        </motion.div>
      </main>

      <Dialog
        open={visualInspector !== null}
        onOpenChange={(open) => {
          if (!open) setVisualInspector(null);
        }}
      >
        <DialogContent className="max-w-[min(1200px,95vw)] h-[88vh] rounded-[2rem] border-white/10 bg-background/95 p-0 overflow-hidden">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-white/10 px-6 py-5">
              <DialogTitle className="font-black tracking-tight">
                {visualInspector === "mindmap"
                  ? "Mind map inspect mode"
                  : "Infographic inspect mode"}
              </DialogTitle>
              <DialogDescription>
                {visualInspector === "mindmap"
                  ? "Zoom, scan, and inspect the concept structure without the rest of the workspace in view."
                  : "Study the infographic as a dedicated visual artifact instead of an inline card."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-6">
              {visualInspector === "mindmap" && session.result.mindmapData && (
                <MindMap mindmapData={session.result.mindmapData} />
              )}
              {visualInspector === "infographic" && (
                <VisualInfographic
                  summary={session.result.summary}
                  originalWordCount={session.originalWordCount}
                  keyTerms={session.result.keyTerms}
                  difficultyLevel={session.result.difficulty_level}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {focusMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-none z-[45] transition-all duration-1000" />
      )}

      <ReadingRuler isVisible={showRuler} />
    </div>
  );
}

function SidebarCard({
  icon,
  title,
  label,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-[2rem] p-6 border-white/10 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <h3 className="font-black text-lg tracking-tight">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {label}
        </span>
      </div>
      <p className="font-black text-base leading-tight">{value}</p>
    </div>
  );
}

function VisualPreviewCard({
  title,
  description,
  status,
  icon,
  children,
  onInspect,
  disabled = false,
}: {
  title: string;
  description: string;
  status: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onInspect: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            {icon}
          </div>
          <div>
            <h4 className="font-black text-lg tracking-tight">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {status}
        </span>
      </div>
      {children}
      <Button
        onClick={onInspect}
        disabled={disabled}
        className="w-full rounded-2xl h-11 font-bold"
      >
        <Eye className="w-4 h-4 mr-2" />
        Inspect
      </Button>
    </div>
  );
}
