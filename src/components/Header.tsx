import {
  BookOpen,
  Sun,
  Moon,
  Type,
  Plus,
  Minus,
  Eye,
  RotateCcw,
  History as HistoryIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeaderProps {
  dyslexicFont?: boolean;
  setDyslexicFont?: (v: boolean) => void;
  fontSize?: "normal" | "large" | "xlarge";
  setFontSize?: (v: "normal" | "large" | "xlarge") => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  showRuler?: boolean;
  setShowRuler?: (v: boolean) => void;
  onReset?: () => void;
  onOpenVault?: () => void;
  hasResult?: boolean;
}

export function Header({
  dyslexicFont = false,
  setDyslexicFont,
  fontSize = "normal",
  setFontSize,
  darkMode = false,
  setDarkMode,
  showRuler = false,
  setShowRuler,
  onReset,
  onOpenVault,
  hasResult,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-header z-50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group px-4 py-1.5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center pulse-glow overflow-hidden border border-primary/20">
            <img
              src="/branding/logo.png"
              alt="Klaro AI Logo"
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-indigo-400 uppercase">
            Klaro AI
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            onClick={onOpenVault}
            title="Open Study Vault"
          >
            <HistoryIcon className="w-4 h-4" />
          </Button>

          {hasResult && onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onReset}
              title="New study session"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant={dyslexicFont ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setDyslexicFont(!dyslexicFont)}
            title="Toggle dyslexia-friendly font"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() =>
              setFontSize(
                fontSize === "normal"
                  ? "large"
                  : fontSize === "large"
                    ? "xlarge"
                    : "normal",
              )
            }
            title="Adjust text size"
          >
            {fontSize === "xlarge" ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant={showRuler ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setShowRuler(!showRuler)}
            title="Reading ruler"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant={darkMode ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
