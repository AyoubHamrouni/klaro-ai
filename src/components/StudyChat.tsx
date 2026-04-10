import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Eraser,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StudyChatProps {
  context: string;
}

export function StudyChat({ context }: StudyChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Klaro, your study companion. Once you summarize a lesson, I can help you understand it better. What are we studying today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const supportsVoice =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const speakReply = async (text: string) => {
    if (!voiceMode || !text.trim()) return;

    try {
      stopSpeaking();
      setIsSpeaking(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/text-to-speech`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const messageText = (overrideMessage ?? input).trim();
    if (!messageText || isTyping) return;

    if (!context) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageText },
        {
          role: "assistant",
          content:
            "I'd love to help, but I don't have a lesson to reference yet! Please upload a PDF or paste some text first so I can assist you best. ✨",
        },
      ]);
      setInput("");
      void speakReply(
        "I'd love to help, but I don't have a lesson to reference yet. Please upload a PDF or paste some text first so I can assist you best.",
      );
      return;
    }

    const userMsg = messageText;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: context,
          history: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      void speakReply(data.reply);
    } catch (err) {
      const fallback =
        "I'm having a little trouble connecting right now. Please check your API keys in server/.env and try again!";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallback,
        },
      ]);
      void speakReply(fallback);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!supportsVoice) {
      toast({
        variant: "destructive",
        title: "Voice input unavailable",
        description: "Your browser does not support speech recognition.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        setInput(transcript);
        void handleSend(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Voice input failed",
        description: "Please try speaking again or type your question instead.",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Voice input failed",
        description: "Please try again after allowing microphone access.",
      });
    }
  };

  const clearChat = () => {
    recognitionRef.current?.abort();
    stopSpeaking();
    setInput("");
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! I'm ready for new questions. 📚",
      },
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-2xl pulse-glow group bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {context && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-primary" />
              )}
            </div>
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[90vw] h-[550px] max-h-[75vh] glass-card rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border-white/20"
          >
            {/* Header */}
            <div className="p-5 bg-primary/10 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight">
                    Klaro AI
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${context ? "bg-success animate-pulse" : "bg-muted-foreground/30"}`}
                    />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      {context ? "Active Session" : "Awaiting Context"}
                    </span>
                  </div>
                  {voiceMode && (
                    <p className="text-[10px] text-primary uppercase font-black tracking-widest mt-1">
                      {isSpeaking
                        ? "Speaking response..."
                        : isListening
                          ? "Listening..."
                          : "Voice mode on"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setVoiceMode((v) => {
                      if (v) stopSpeaking();
                      return !v;
                    })
                  }
                  className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  title={voiceMode ? "Disable voice replies" : "Enable voice replies"}
                >
                  {voiceMode ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  title={isListening ? "Stop listening" : "Speak to the study buddy"}
                >
                  {isListening ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  title="Clear Chat"
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6 py-6" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg"
                          : "bg-white/5 backdrop-blur-md rounded-tl-none border border-white/10"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 mb-1.5 opacity-50 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "assistant" ? (
                          <Sparkles className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {msg.role === "assistant" ? "Klaro" : "Student"}
                        </span>
                      </div>
                      <p className="font-medium whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
                      <div className="flex gap-1.5">
                        <span
                          className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-5 bg-black/20 backdrop-blur-xl border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    context ? "Ask about the lesson..." : "Awaiting context..."
                  }
                  className="bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-primary/30"
                  disabled={isTyping}
                />
                <Button
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="rounded-2xl shrink-0 w-12 h-12 shadow-lg shadow-primary/10"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
