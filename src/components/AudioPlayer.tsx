import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface AudioPlayerProps {
  text: string;
  onProgressChange?: (progress: number) => void;
  onPlayingChange?: (playing: boolean) => void;
}

export function AudioPlayer({ text, onProgressChange, onPlayingChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAudio = useCallback(async () => {
    if (audioUrl) return audioUrl;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (response.status === 429) {
        toast({ variant: 'destructive', title: 'Rate limited', description: 'Too many requests. Please wait a moment.' });
        return null;
      }
      if (response.status === 402) {
        toast({ variant: 'destructive', title: 'Credits needed', description: 'Please add credits to continue using TTS.' });
        return null;
      }
      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } catch {
      toast({ variant: 'destructive', title: 'Audio Error', description: 'Failed to generate audio. Please try again.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [text, audioUrl]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    let url = audioUrl;
    if (!url) {
      url = await fetchAudio();
      if (!url) return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    audioRef.current.playbackRate = speed;
    await audioRef.current.play();
    setIsPlaying(true);
  }, [isPlaying, audioUrl, fetchAudio, speed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const speeds = [0.75, 1, 1.25, 1.5];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlayback}
              disabled={isLoading}
              size="icon"
              className="h-12 w-12 rounded-full bg-accent hover:bg-accent/90"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Listen to Summary</span>
              </div>
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                className="cursor-pointer"
                onValueChange={([val]) => {
                  if (audioRef.current && audioRef.current.duration) {
                    audioRef.current.currentTime = (val / 100) * audioRef.current.duration;
                    setProgress(val);
                  }
                }}
              />
            </div>

            <div className="flex gap-1">
              {speeds.map((s) => (
                <Button
                  key={s}
                  variant={speed === s ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-2 h-7"
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
