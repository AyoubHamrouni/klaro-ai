import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  Link2,
  FileCode,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_TEXT } from "@/lib/sample-text";
import {
  processDocument,
  countWords,
  SUPPORTED_EXTENSIONS,
} from "@/lib/document-processor";
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
  const [sourceType, setSourceType] = useState<"file" | "url" | "sample" | "">(
    "",
  );
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const isOverLimit = wordCount > MAX_WORDS;

  const handleTextChange = (value: string) => {
    setText(value);
    setError("");
    setSourceLabel("");
    setSourceType("");
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      setError("");
      const result = await processDocument(file);
      setSourceLabel(result.metadata.fileName);
      setSourceType("file");
      setText(result.text);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process the document.";
      setError(message);
      setSourceLabel("");
      setSourceType("");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleUrlInput = useCallback(async () => {
    const url = urlInputRef.current?.value?.trim();
    if (!url) {
      setError("Please enter a valid URL");
      return;
    }

    setIsProcessing(true);
    try {
      setError("");
      // For now, show a message that URL processing is done server-side
      setSourceLabel(new URL(url).hostname);
      setSourceType("url");
      setText(
        `[Shared Link: ${url}]\n\nNote: The full content will be available once processed by our server. Supported: Google Drive, Wikipedia, Medium, arXiv, GitHub, Dev.to`,
      );
      setShowUrlInput(false);
      if (urlInputRef.current) {
        urlInputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid URL";
      setError(message);
    } finally {
      setIsProcessing(false);
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
            placeholder="Paste your source text here or drag & drop a document..."
            className="min-h-[250px] text-lg md:text-xl leading-relaxed resize-none font-dyslexic bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 p-6"
            disabled={isLoading || isProcessing}
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
                  Drop a document to import
                </p>
                <p className="text-white/70 text-sm mt-2">
                  PDF, DOC, DOCX, TXT, CSV, PPT supported
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
                ) : sourceType === "url" ? (
                  <Link2 className="w-4 h-4" />
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

        {/* URL Input Dialog */}
        <AnimatePresence>
          {showUrlInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 p-4 rounded-2xl border border-primary/20 bg-primary/5"
            >
              <input
                ref={urlInputRef}
                type="url"
                placeholder="Paste a link (Google Drive, Wikipedia, Medium, etc.)"
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleUrlInput();
                }}
              />
              <Button
                size="sm"
                onClick={handleUrlInput}
                disabled={isProcessing}
                className="whitespace-nowrap"
              >
                {isProcessing ? "Processing..." : "Add Link"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowUrlInput(false)}
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim() || isOverLimit || isProcessing}
            size="lg"
            className="relative h-14 font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/85 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden md:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            {isLoading ? "Analyzing..." : "Summarize"}
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessing}
            size="lg"
            className="h-14 font-semibold text-base rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/35 active:scale-[0.98] shadow-sm transition-all text-primary"
            title={`Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`}
          >
            <Upload className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Import File</span>
            <span className="sm:hidden">File</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={isLoading || isProcessing}
            size="lg"
            className="h-14 font-semibold text-base rounded-2xl hover:bg-primary/10 hover:text-foreground active:scale-[0.98] transition-all"
            title="Share a public link from Google Drive, Wikipedia, Medium, arXiv, GitHub, or Dev.to"
          >
            <Link2 className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Share Link</span>
            <span className="sm:hidden">Link</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setText(SAMPLE_TEXT);
              setError("");
              setSourceLabel("Sample text");
              setSourceType("sample");
            }}
            disabled={isLoading || isProcessing}
            size="lg"
            className="h-14 font-semibold text-base rounded-2xl hover:bg-primary/10 hover:text-foreground active:scale-[0.98] transition-all md:col-span-1"
          >
            <FileCode className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Try Sample</span>
            <span className="sm:hidden">Sample</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {/* Supported formats info */}
        <div className="text-xs text-muted-foreground px-2 text-center">
          <span className="opacity-70">
            Supported formats: {SUPPORTED_EXTENSIONS.join(", ")} • Share links
            from major platforms
          </span>
        </div>
      </div>
    </motion.div>
  );
}
