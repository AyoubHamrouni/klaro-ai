import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  History,
  BookOpen,
  Clock,
  Trash2,
  ChevronRight,
  Layout,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SummaryResult } from "./ResultsTabs";

interface HistoryItem {
  id: string;
  timestamp: number;
  result: SummaryResult;
  originalText: string;
}

interface HistorySidebarProps {
  onSelect: (item: HistoryItem) => void;
  currentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const difficultyColors = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-warm/20 text-warm border-warm/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

export function HistorySidebar({
  onSelect,
  currentId,
  isOpen,
  onClose,
}: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("study-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("study-history");
      if (saved) setHistory(JSON.parse(saved));
    };
    window.addEventListener("storage-update", handleStorageChange);
    return () =>
      window.removeEventListener("storage-update", handleStorageChange);
  }, []);

  const filteredHistory = useMemo(() => {
    return history
      .filter(
        (item) =>
          item.result.summary
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.result.keyTerms.some((t) =>
            t.term.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchQuery]);

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("study-history", JSON.stringify(newHistory));
    window.dispatchEvent(new Event("storage-update"));
  };

  const clearAll = () => {
    if (
      confirm("Permanently delete all study history? This cannot be undone.")
    ) {
      setHistory([]);
      localStorage.removeItem("study-history");
      window.dispatchEvent(new Event("storage-update"));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full md:w-[400px] glass-card border-r border-white/10 z-[110] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-primary/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Layout className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-extrabold text-lg tracking-tight">Vault</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-white/10"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Find lessons or terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-20 px-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Clock className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {searchQuery
                        ? "No matches found."
                        : "Your study vault is empty."}
                    </p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className={`group relative p-4 rounded-3xl cursor-pointer transition-all border ${
                        currentId === item.id
                          ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-widest ${difficultyColors[item.result.difficulty_level as keyof typeof difficultyColors] || "border-white/20 text-muted-foreground"}`}
                        >
                          {item.result.difficulty_level}
                        </Badge>
                        <button
                          onClick={(e) => deleteItem(item.id, e)}
                          className="bg-white/0 hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive p-1.5 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-extrabold line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
                        {item.result.summary}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                        <span className="mx-1">•</span>
                        <Sparkles className="w-3 h-3" />
                        {item.result.keyTerms.length} terms
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-6 bg-white/5 border-t border-white/10">
                <Button
                  variant="ghost"
                  className="w-full text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 uppercase tracking-widest transition-all"
                  onClick={clearAll}
                >
                  Wipe Vault
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
