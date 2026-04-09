import {
  BookOpen,
  Sun,
  Moon,
  Type,
  Plus,
  Minus,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeaderProps {
  dyslexicFont: boolean;
  setDyslexicFont: (v: boolean) => void;
  fontSize: "normal" | "large" | "xlarge";
  setFontSize: (v: "normal" | "large" | "xlarge") => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showRuler: boolean;
  setShowRuler: (v: boolean) => void;
  onReset?: () => void;
  hasResult?: boolean;
}

export function Header({
  dyslexicFont,
  setDyslexicFont,
  fontSize,
  setFontSize,
  darkMode,
  setDarkMode,
  showRuler,
  setShowRuler,
  onReset,
  hasResult,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-sm"
    >
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg tracking-tight">
            Study<span className="text-primary">Ease</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasResult && onReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onReset}
              title="New text"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant={dyslexicFont ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDyslexicFont(!dyslexicFont)}
            title="Toggle dyslexia-friendly font"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
            className="h-8 w-8"
            onClick={() => setShowRuler(!showRuler)}
            title="Reading ruler"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
