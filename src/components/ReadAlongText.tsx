import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ReadAlongTextProps {
  text: string;
  progress: number; // 0-100
  isPlaying: boolean;
}

export function ReadAlongText({ text, progress, isPlaying }: ReadAlongTextProps) {
  const sentences = useMemo(() => {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }, [text]);

  const currentIndex = useMemo(() => {
    if (!isPlaying && progress === 0) return -1;
    return Math.min(
      Math.floor((progress / 100) * sentences.length),
      sentences.length - 1
    );
  }, [progress, sentences.length, isPlaying]);

  return (
    <div className="space-y-1 font-dyslexic text-lg leading-relaxed">
      {sentences.map((sentence, i) => (
        <motion.span
          key={i}
          className={`inline transition-colors duration-300 rounded px-0.5 ${
            i === currentIndex
              ? 'bg-primary/20 text-foreground'
              : i < currentIndex
                ? 'text-muted-foreground'
                : 'text-foreground'
          }`}
        >
          {sentence}
        </motion.span>
      ))}
    </div>
  );
}
