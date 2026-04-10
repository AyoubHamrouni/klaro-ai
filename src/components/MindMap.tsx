import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  GitBranch,
  Layers3,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapProps {
  mindmapData: string;
  mode?: "inline" | "expanded";
}

interface MindmapTreeNode {
  label: string;
  children: MindmapTreeNode[];
}

function cleanMindmapData(data: string) {
  return data
    .replace(/```(?:mermaid)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseMindmapTree(data: string): MindmapTreeNode {
  const root: MindmapTreeNode = { label: "Main Topic", children: [] };
  const stack: Array<{ depth: number; node: MindmapTreeNode }> = [
    { depth: -1, node: root },
  ];
  let rootAssigned = false;

  const lines = cleanMindmapData(data)
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim() && line.trim() !== "mindmap");

  for (const line of lines) {
    const depth = Math.max(
      0,
      Math.floor((line.match(/^ */)?.[0].length ?? 0) / 2),
    );

    const label = line
      .trim()
      .replace(/^root\(\(/i, "")
      .replace(/^\(\(/, "")
      .replace(/\)\)$/, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .trim();

    if (!label) continue;

    if (depth === 1 && !rootAssigned) {
      root.label = label;
      rootAssigned = true;
      stack.length = 1;
      stack[0] = { depth, node: root };
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

function countNodes(node: MindmapTreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function buildOutline(root: MindmapTreeNode) {
  const lines = [root.label];
  root.children.forEach((branch) => {
    lines.push(`- ${branch.label}`);
    branch.children.forEach((detail) => {
      lines.push(`  - ${detail.label}`);
    });
  });
  return lines.join("\n");
}

export function MindMap({ mindmapData, mode = "inline" }: MindMapProps) {
  const tree = useMemo(() => parseMindmapTree(mindmapData), [mindmapData]);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const isExpanded = mode === "expanded";

  const selectedBranch =
    tree.children[selectedBranchIndex] || tree.children[0] || null;
  const nodeCount = countNodes(tree);
  const outline = useMemo(() => buildOutline(tree), [tree]);

  const downloadOutline = () => {
    const blob = new Blob([outline], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "klaro-ai-concept-map.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isExpanded
          ? "h-full w-full flex flex-col rounded-[1.25rem] border border-white/10 bg-background p-4 md:p-5"
          : "glass-card rounded-[1.6rem] border-white/10 p-5 shadow-xl"
      }
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-[1rem] border border-primary/15 bg-primary/10 p-2.5">
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">Concept Map</h3>
            <p className="text-sm text-muted-foreground">
              Follow one branch at a time to keep the structure easy to scan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setScale((value) => Math.max(0.9, value - 0.05))}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-xs font-bold text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setScale((value) => Math.min(1.15, value + 0.05))}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => {
              setSelectedBranchIndex(0);
              setScale(1);
            }}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={downloadOutline}
            title="Download outline"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Central topic" value={tree.label} />
        <StatCard label="Main branches" value={String(tree.children.length)} />
        <StatCard
          label="Detail nodes"
          value={String(Math.max(nodeCount - tree.children.length - 1, 0))}
        />
        <StatCard
          label="Active focus"
          value={selectedBranch?.label || "Overview"}
        />
      </div>

      <div className="rounded-[1.4rem] border border-border/80 bg-gradient-to-br from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900 flex-1 flex flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          Select a branch to narrow the map. The central idea stays pinned so
          orientation is never lost.
        </div>

        <div className="flex-1 overflow-auto">
          <div
            className={`grid gap-3 md:gap-4 w-full auto-rows-max px-1 ${
              isExpanded
                ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2"
            }`}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <section className="rounded-[1.35rem] border border-primary/15 bg-primary/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/80">
                Central concept
              </p>
              <h4 className="mt-3 text-2xl font-black tracking-tight leading-tight">
                {tree.label}
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This is the anchor for the whole topic. Start here, then move
                right into one branch.
              </p>
            </section>

            <section className="rounded-[1.35rem] border border-border/80 bg-background/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Main branches
              </p>
              <div className="mt-3 grid gap-2">
                {tree.children.map((branch, index) => {
                  const active = index === selectedBranchIndex;
                  return (
                    <button
                      key={branch.label}
                      type="button"
                      onClick={() => setSelectedBranchIndex(index)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          setSelectedBranchIndex((value) =>
                            Math.min(value + 1, tree.children.length - 1),
                          );
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          setSelectedBranchIndex((value) =>
                            Math.max(value - 1, 0),
                          );
                        }
                      }}
                      className={`rounded-[1rem] border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                        active
                          ? "border-primary/25 bg-primary text-primary-foreground shadow-md"
                          : "border-border/80 bg-background hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black leading-snug">
                            {branch.label}
                          </p>
                          <p
                            className={`mt-1 text-xs ${active ? "text-primary-foreground/85" : "text-muted-foreground"}`}
                          >
                            {branch.children.length} supporting details
                          </p>
                        </div>
                        <GitBranch
                          className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-accent"}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-border/80 bg-background/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Focused details
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedBranch?.label || "empty"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="mt-3 space-y-3"
                >
                  {selectedBranch ? (
                    <>
                      <div className="rounded-[1rem] border border-accent/20 bg-accent/10 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                          Active branch
                        </p>
                        <p className="mt-2 text-lg font-black leading-tight">
                          {selectedBranch.label}
                        </p>
                      </div>
                      {selectedBranch.children.length > 0 ? (
                        selectedBranch.children.map((detail) => (
                          <div
                            key={detail.label}
                            className="rounded-[1rem] border border-border/80 bg-secondary/40 px-4 py-3"
                          >
                            <p className="text-sm font-semibold leading-relaxed">
                              {detail.label}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1rem] border border-border/80 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                          This branch does not have extra detail nodes yet.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-[1rem] border border-border/80 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                      No branch is available yet.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/60 px-4 py-3 dark:bg-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-snug">{value}</p>
    </div>
  );
}
