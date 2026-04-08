import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SAMPLE_TEXT } from '@/lib/sample-text';
import { extractTextFromPDF, countWords } from '@/lib/pdf-parser';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_WORDS = 5000;

interface TextInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function TextInput({ onSubmit, isLoading }: TextInputProps) {
  const [text, setText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const isOverLimit = wordCount > MAX_WORDS;

  const handleTextChange = (value: string) => {
    setText(value);
    setError('');
    setFileName('');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported. Please upload a PDF or paste text directly.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum size is 20MB.');
      return;
    }
    try {
      setError('');
      setFileName(file.name);
      const extracted = await extractTextFromPDF(file);
      if (!extracted.trim()) {
        setError('Could not extract text from this PDF. It may be image-based. Try pasting the text instead.');
        setFileName('');
        return;
      }
      setText(extracted);
    } catch {
      setError('Failed to read the PDF. Please try a different file or paste text directly.');
      setFileName('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Please enter or upload some text first.');
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative transition-all duration-200 rounded-lg ${dragActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}
          >
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste your text here, or drag & drop a PDF file..."
              className="min-h-[200px] text-base leading-relaxed resize-y font-dyslexic bg-background/80"
              disabled={isLoading}
            />
            <AnimatePresence>
              {dragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-primary"
                >
                  <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                    <Upload className="w-6 h-6" />
                    Drop your PDF here
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Word count & file info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              {fileName && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {fileName}
                </span>
              )}
            </div>
            <span className={`font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
            </span>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim() || isOverLimit}
              size="lg"
              className="font-semibold text-base px-8"
            >
              <Sparkles className="w-5 h-5" />
              {isLoading ? 'Summarizing...' : 'Summarize'}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              size="lg"
            >
              <Upload className="w-5 h-5" />
              Upload PDF
            </Button>

            <Button
              variant="secondary"
              onClick={() => { setText(SAMPLE_TEXT); setError(''); setFileName('demo-text.txt'); }}
              disabled={isLoading}
              size="lg"
            >
              <FileText className="w-5 h-5" />
              Try Demo
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
