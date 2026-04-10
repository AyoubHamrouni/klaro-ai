import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_TEXT } from "@/lib/sample-text";
import { extractTextFromPDF, countWords } from "@/lib/pdf-parser";
import { motion, AnimatePresence } from "framer-motion";

const MAX_WORDS = 5000;

interface TextInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function TextInput({ onSubmit, isLoading }: TextInputProps) {
  const [text, setText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceType, setSourceType] = useState<"file" | "sample" | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const isOverLimit = wordCount > MAX_WORDS;

  const handleTextChange = (value: string) => {
    setText(value);
    setError("");
    setSourceLabel("");
    setSourceType("");
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError(
        "Only PDF files are supported. Please upload a PDF or paste text directly.",
      );
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum size is 20MB.");
      return;
    }
    try {
      setError("");
      setSourceLabel(file.name);
      setSourceType("file");
      const extracted = await extractTextFromPDF(file);
      if (!extracted.trim()) {
        setError(
          "Could not extract text from this PDF. It may be image-based. Try pasting the text instead.",
        );
        setSourceLabel("");
        setSourceType("");
        return;
      }
      setText(extracted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to read the PDF.";
      setError(
        message === "This PDF appears to be image-based and OCR could not extract readable text."
          ? "This PDF is image-based. OCR could not extract readable text, so please try a different scan or paste the text directly."
          : "Failed to read the PDF. Please try a different file or paste text directly.",
      );
      setSourceLabel("");
      setSourceType("");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleSubmit = () => {
    if (!text.trim()) {
      setError("Please enter or upload some text first.");
      return;
    }
    if (isOverLimit) {
      setError(`Text exceeds ${MAX_WORDS} word limit. Please shorten it.`);
      return;
    }
    onSubmit(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-[2rem] overflow-hidden"
    >
      <div className="p-6 md:p-8 space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative transition-all duration-300 rounded-2xl overflow-hidden ${
            dragActive
              ? "ring-2 ring-primary ring-offset-4 ring-offset-background scale-[0.99]"
              : ""
          }`}
        >
          <Textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste your source text here or drop a PDF..."
            className="min-h-[250px] text-lg md:text-xl leading-relaxed resize-none font-dyslexic bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 p-6"
            disabled={isLoading}
          />
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-primary/20 z-20"
              >
                <div className="bg-white/10 p-6 rounded-full border border-white/20 mb-4 animate-bounce">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <p className="text-white font-bold text-xl tracking-tight">
                  Drop PDF to Import
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Word count & file info */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            {sourceLabel ? (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 px-3 py-1 items-center gap-2"
              >
                {sourceType === "sample" ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {sourceLabel}
              </Badge>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground/60 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Ready Input
              </div>
            )}
          </div>
          <div
            className={`text-sm font-bold flex items-center gap-2 ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
          >
            <span className="opacity-50 font-medium">Progress:</span>
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
            <span className="text-[10px] uppercase opacity-40">Words</span>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 text-destructive text-sm p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim() || isOverLimit}
            size="lg"
            className="relative h-14 md:col-span-1 font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/85 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            {isLoading ? "Analyzing..." : "Summarize"}
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            size="lg"
            className="h-14 font-semibold text-base rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/35 active:scale-[0.98] shadow-sm transition-all text-primary"
          >
            <Upload className="w-5 h-5 mr-3" />
            Import PDF
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setText(SAMPLE_TEXT);
              setError("");
              setSourceLabel("Sample text");
              setSourceType("sample");
            }}
            disabled={isLoading}
            size="lg"
            className="h-14 font-semibold text-base rounded-2xl hover:bg-primary/10 hover:text-foreground active:scale-[0.98] transition-all"
          >
            <FileText className="w-5 h-5 mr-3" />
            Try Sample
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
