import { useEffect, useMemo, useState, useRef } from "react";
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

interface MindmapTreeNode {
  label: string;
  children: MindmapTreeNode[];
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
    fontFamily: "Lexend, Atkinson Hyperlegible, sans-serif",
    fontSize: "14px",
  },
});

function normalizeMindmapData(data: string) {
  const cleaned = data
    .replace(/```(?:mermaid)?/gi, "")
    .replace(/```/g, "")
    .trim();

  return cleaned.startsWith("mindmap") ? cleaned : `mindmap\n${cleaned}`;
}

function extractLabel(line: string) {
  return line
    .trim()
    .replace(/^root\(\(/i, "")
    .replace(/^\(\(/, "")
    .replace(/\)\)$/, "")
    .replace(/^[-*]\s*/, "")
    .trim();
}

function parseMindmapTree(data: string): MindmapTreeNode {
  const root: MindmapTreeNode = { label: "Mind Map", children: [] };
  const stack: Array<{ depth: number; node: MindmapTreeNode }> = [
    { depth: -1, node: root },
  ];

  let rootAssigned = false;
  const lines = normalizeMindmapData(data)
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim().length > 0 && line.trim() !== "mindmap");

  for (const line of lines) {
    const depth = Math.max(0, Math.floor((line.match(/^ */)?.[0].length ?? 0) / 2));
    const label = extractLabel(line) || "Node";

    if (depth === 0 && !rootAssigned) {
      root.label = label;
      rootAssigned = true;
      stack.length = 1;
      stack[0] = { depth: 0, node: root };
      continue;
    }

    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    const child: MindmapTreeNode = { label, children: [] };
    parent.children.push(child);
    stack.push({ depth, node: child });
  }

  return root;
}

function MindmapNode({
  node,
  depth = 0,
}: {
  node: MindmapTreeNode;
  depth?: number;
}) {
  return (
    <div className={depth === 0 ? "space-y-4" : "pl-5 border-l border-white/10 space-y-3"}>
      {depth > 0 && (
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {node.label}
        </div>
      )}
      {depth === 0 && (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-base font-black text-foreground">
          <GitBranch className="w-4 h-4 text-primary" />
          {node.label}
        </div>
      )}
      {node.children.length > 0 && (
        <div className="space-y-3">
          {node.children.map((child) => (
            <MindmapNode key={`${depth}-${child.label}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMap({ mindmapData }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isRendering, setIsRendering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [scale, setScale] = useState(1);

  const fallbackTree = useMemo(() => parseMindmapTree(mindmapData), [mindmapData]);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setIsRendering(true);
      setHasError(false);

      const cleanData = normalizeMindmapData(mindmapData);

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
    if (!svgContent) return;
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

      <div
        ref={containerRef}
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center bg-indigo-950/20 rounded-2xl border border-indigo-500/10 overflow-auto p-4"
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Rendering mind map…</p>
          </div>
        )}
        {svgContent && !isRendering && !hasError && (
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
        {hasError && !isRendering && (
          <div className="w-full max-w-2xl space-y-5">
            <div className="text-center text-muted-foreground p-2">
              <GitBranch className="w-10 h-10 mx-auto text-indigo-400/40" />
              <p className="font-bold text-sm">Using fallback mind map</p>
              <p className="text-xs opacity-60">
                The structured tree below is rendered locally when Mermaid syntax is unstable.
              </p>
            </div>
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center top",
                transition: "transform 0.2s ease",
              }}
              className="w-full"
            >
              <MindmapNode node={fallbackTree} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
