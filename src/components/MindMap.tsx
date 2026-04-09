import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";
import {
  GitBranch,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapProps {
  mindmapData: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  mindmap: { padding: 16 },
  themeVariables: {
    primaryColor: "#6366f1",
    primaryTextColor: "#f1f5f9",
    primaryBorderColor: "#4f46e5",
    lineColor: "#6366f1",
    secondaryColor: "#0f172a",
    tertiaryColor: "#1e1b4b",
    background: "transparent",
    nodeBorder: "#4f46e5",
    mainBkg: "#1e1b4b",
    nodeBkg: "#1e1b4b",
    clusterBkg: "#0f172a",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
  },
});

export function MindMap({ mindmapData }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isRendering, setIsRendering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setIsRendering(true);
      setHasError(false);

      // Ensure the syntax uses "mindmap" type
      const cleanData = mindmapData.trim().startsWith("mindmap")
        ? mindmapData.trim()
        : `mindmap\n${mindmapData.trim()}`;

      try {
        const id = `mm-${Date.now()}`;
        const { svg } = await mermaid.render(id, cleanData);
        if (!cancelled) {
          setSvgContent(svg);
          setIsRendering(false);
        }
      } catch (e) {
        console.error("MindMap render error:", e);
        if (!cancelled) {
          setHasError(true);
          setIsRendering(false);
        }
      }
    };

    if (mindmapData) render();
    return () => {
      cancelled = true;
    };
  }, [mindmapData]);

  const downloadSvg = () => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumina-mindmap.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[2.5rem] p-6 border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
            <GitBranch className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">Mind Map</h3>
            <p className="text-xs text-muted-foreground font-medium">
              AI-generated concept hierarchy
            </p>
          </div>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-8 h-8"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold tabular-nums w-10 text-center text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-8 h-8"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-8 h-8"
            onClick={() => setScale(1)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          {svgContent && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-8 h-8 text-indigo-400 hover:bg-indigo-500/10"
              onClick={downloadSvg}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Diagram Area */}
      <div
        ref={containerRef}
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center bg-indigo-950/20 rounded-2xl border border-indigo-500/10 overflow-auto"
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Rendering mind map…</p>
          </div>
        )}
        {hasError && !isRendering && (
          <div className="text-center text-muted-foreground p-8 space-y-2">
            <GitBranch className="w-10 h-10 mx-auto text-indigo-400/30" />
            <p className="font-bold text-sm">Diagram format unavailable</p>
            <p className="text-xs opacity-60">
              The AI returned a format that couldn't be rendered. Try
              summarizing again.
            </p>
            <pre className="text-left text-[10px] bg-black/30 rounded-xl p-4 max-h-40 overflow-auto text-muted-foreground mt-2">
              {mindmapData}
            </pre>
          </div>
        )}
        {svgContent && !isRendering && (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center top",
              transition: "transform 0.2s ease",
            }}
            className="p-4 w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </motion.div>
  );
}
