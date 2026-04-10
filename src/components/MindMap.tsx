import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapProps {
  mindmapData: string;
}

interface MindmapTreeNode {
  label: string;
  children: MindmapTreeNode[];
}

function countNodes(node: MindmapTreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function parseMindmapTree(data: string): MindmapTreeNode {
  const root: MindmapTreeNode = { label: "Main Topic", children: [] };
  const stack: Array<{ depth: number; node: MindmapTreeNode }> = [
    { depth: -1, node: root },
  ];

  let rootAssigned = false;

  // Clean and normalize the input data
  const cleaned = data
    .replace(/```(?:mermaid)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        trimmed !== "mindmap" &&
        !trimmed.startsWith("graph") &&
        !trimmed.startsWith("flowchart")
      );
    });

  for (const line of lines) {
    const depth = Math.max(
      0,
      Math.floor((line.match(/^ */)?.[0].length ?? 0) / 2),
    );

    // Extract label
    let label = line
      .trim()
      .replace(/^root\(\(/i, "")
      .replace(/^\(\(/, "")
      .replace(/\)\)$/, "")
      .replace(/^[-*]\s*/, "")
      .trim();

    // Remove markdown formatting
    label = label
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .trim();

    if (!label) continue;

    // Truncate long labels
    label = label.slice(0, 100);

    if (depth === 0 && !rootAssigned) {
      root.label = label;
      rootAssigned = true;
      stack.length = 1;
      stack[0] = { depth: 0, node: root };
      continue;
    }

    // Pop stack to correct depth
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

interface NodeComponentProps {
  node: MindmapTreeNode;
  depth?: number;
}

function MindmapNode({ node, depth = 0 }: NodeComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const bgByDepth = [
    "bg-gradient-to-r from-primary/20 to-indigo-500/20 border-primary/40",
    "bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border-indigo-500/30",
    "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/25",
  ];

  const hasChildren = node.children.length > 0;

  return (
    <div
      className={
        depth === 0
          ? "space-y-5"
          : "pl-6 border-l-2 border-white/15 space-y-3 py-2"
      }
    >
      {depth === 0 ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-3 rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-primary/15 to-indigo-500/15 px-6 py-3 text-lg font-black text-foreground shadow-lg"
        >
          <GitBranch className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="truncate">{node.label}</span>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full text-left flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:shadow-md transition-all group ${
            bgByDepth[Math.min(depth - 1, 2)]
          }`}
        >
          {hasChildren ? (
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
            >
              <ChevronDown className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
            </motion.div>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-primary/60" />
            </div>
          )}
          <span className="flex-1 truncate">{node.label}</span>
          {hasChildren && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-muted-foreground font-mono flex-shrink-0">
              {node.children.length}
            </span>
          )}
        </motion.button>
      )}

      {hasChildren && isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {node.children.map((child, idx) => (
            <motion.div
              key={`${depth}-${child.label}-${idx}`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <MindmapNode node={child} depth={depth + 1} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function MindMap({ mindmapData }: MindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const fallbackTree = useMemo(
    () => parseMindmapTree(mindmapData),
    [mindmapData],
  );

  const branchCount = fallbackTree.children.length;
  const nodeCount = countNodes(fallbackTree);
  const leadingBranches = fallbackTree.children.slice(0, 4);

  const downloadAsImage = () => {
    if (!containerRef.current) return;

    const container = containerRef.current.querySelector(".mindmap-content");
    if (!container) return;

    // Convert to SVG and download
    const svg = container.innerHTML;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-buddy-mindmap.svg";
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
              Interactive concept hierarchy for your study material
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
            title="Zoom out"
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
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-8 h-8"
            onClick={() => setScale(1)}
            title="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-8 h-8 text-indigo-400 hover:bg-indigo-500/10"
            onClick={downloadAsImage}
            title="Download as image"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Root Topic
          </p>
          <p className="font-black text-sm mt-1 truncate">
            {fallbackTree.label}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Main Branches
          </p>
          <p className="font-black text-sm mt-1">{branchCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Total Nodes
          </p>
          <p className="font-black text-sm mt-1">{nodeCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Best For
          </p>
          <p className="font-black text-sm mt-1">Overview</p>
        </div>
      </div>

      {/* Key Branches Preview */}
      {leadingBranches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {leadingBranches.map((branch) => (
            <span
              key={branch.label}
              className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-foreground"
            >
              {branch.label}
            </span>
          ))}
        </div>
      )}

      {/* Mind Map Container */}
      <div
        ref={containerRef}
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center bg-indigo-950/20 rounded-2xl border border-indigo-500/10 overflow-auto p-6"
      >
        <div className="w-full max-w-full">
          <div className="text-center text-muted-foreground p-2 mb-6">
            <p className="text-xs opacity-60 font-medium">
              💡 Click nodes to expand/collapse • Explore the hierarchy
            </p>
          </div>

          <div
            className="mindmap-content w-full"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center top",
              transition: "transform 0.2s ease-out",
            }}
          >
            <MindmapNode node={fallbackTree} depth={0} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
