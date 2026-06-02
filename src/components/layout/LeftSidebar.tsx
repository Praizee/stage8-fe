"use client";
import { useState } from "react";
import { Clock, Bookmark, Database, Trash2, RotateCcw, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { useUIStore } from "@/store/ui-store";
import { ALL_SCHEMAS } from "@/lib/schemas";
import type { QueryHistoryEntry, QueryPreset } from "@/lib/query-engine/types";

const TYPE_COLORS: Record<string, string> = {
  string:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  number:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  boolean: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  enum:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  date:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function schemaName(id: string) {
  return ALL_SCHEMAS.find((s) => s.id === id)?.name ?? id;
}

// ─── Schema Tab ───────────────────────────────────────────────────────────────

function SchemaTab() {
  const { activeSchema } = useSchemaStore();
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <p className="font-medium text-sm">{activeSchema.name}</p>
        <p className="text-xs text-muted-foreground">{activeSchema.description}</p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {activeSchema.fields.map((field) => (
            <div key={field.key} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/30 transition-colors">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{field.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{field.key}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] font-mono ml-1 flex-shrink-0 ${TYPE_COLORS[field.type] ?? ""}`}>
                {field.type}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {activeSchema.fields.length} fields · <span className="font-mono">{activeSchema.tableName}</span>
        </p>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const { history, clearHistory } = useUIStore();
  const { loadQuery } = useQueryStore();
  const { setActiveSchema } = useSchemaStore();
  const [restored, setRestored] = useState<string | null>(null);

  function handleRestore(entry: QueryHistoryEntry) {
    const root = useQueryStore.getState().root;
    if (root.children.length > 0 && !confirm("This will replace your current query. Continue?")) return;
    if (entry.schemaId !== useSchemaStore.getState().activeSchema.id) {
      setActiveSchema(entry.schemaId);
    }
    loadQuery(entry.tree);
    setRestored(entry.id);
    setTimeout(() => setRestored(null), 1500);
  }

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Clock className="h-7 w-7 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">No history yet.</p>
        <p className="text-[10px] text-muted-foreground/60">Run queries to see them here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] text-muted-foreground">{history.length} entries</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-destructive gap-1" onClick={clearHistory}>
          <Trash2 className="h-3 w-3" /> Clear
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {history.map((entry) => (
            <div key={entry.id} className="group px-2 py-2 rounded-lg border border-border/50 hover:border-border hover:bg-accent/20 transition-all">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{schemaName(entry.schemaId)}</Badge>
                <span className="text-[10px] text-muted-foreground">{timeAgo(entry.executedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  <span className={`font-semibold ${entry.resultCount > 0 ? "text-emerald-400" : "text-foreground"}`}>{entry.resultCount}</span> results
                  {" · "}{entry.tree.children.length} condition{entry.tree.children.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRestore(entry)}
                  aria-label="Restore query"
                >
                  {restored === entry.id
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    : <RotateCcw className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Presets Tab ──────────────────────────────────────────────────────────────

function PresetsTab({ onSaveNew }: { onSaveNew: () => void }) {
  const { presets, deletePreset } = useUIStore();
  const { loadQuery } = useQueryStore();
  const { setActiveSchema } = useSchemaStore();
  const [loaded, setLoaded] = useState<string | null>(null);

  function handleLoad(preset: QueryPreset) {
    const root = useQueryStore.getState().root;
    if (root.children.length > 0 && !confirm("Load preset? This will replace your current query.")) return;
    if (preset.schemaId !== useSchemaStore.getState().activeSchema.id) {
      setActiveSchema(preset.schemaId);
    }
    loadQuery(preset.tree);
    setLoaded(preset.id);
    setTimeout(() => setLoaded(null), 1500);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1.5" onClick={onSaveNew}>
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save current query
        </Button>
      </div>
      <Separator />
      {presets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Bookmark className="h-7 w-7 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No saved presets.</p>
          <p className="text-[10px] text-muted-foreground/60">Press Ctrl+S to save a preset.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {presets.map((preset) => (
              <div key={preset.id} className="group px-2 py-2 rounded-lg border border-border/50 hover:border-border hover:bg-accent/20 transition-all">
                <div className="flex items-start justify-between mb-1 gap-1">
                  <p className="text-xs font-medium leading-tight break-words flex-1">{preset.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => { if (confirm(`Delete "${preset.name}"?`)) deletePreset(preset.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{schemaName(preset.schemaId)}</Badge>
                    <span className="text-[10px] text-muted-foreground">{preset.tree.children.length} cond.</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleLoad(preset)}
                  >
                    {loaded === preset.id
                      ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      : <RotateCcw className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ─── LeftSidebar ──────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  onSavePreset: () => void;
}

export function LeftSidebar({ onSavePreset }: LeftSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col">
      <Tabs defaultValue="schema" className="flex flex-col flex-1 min-h-0">
        <div className="px-2 pt-2 flex-shrink-0">
          <TabsList className="w-full h-7">
            <TabsTrigger value="schema" className="flex-1 text-[11px] gap-1 h-6">
              <Database className="h-3 w-3" /> Schema
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-[11px] gap-1 h-6">
              <Clock className="h-3 w-3" /> History
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex-1 text-[11px] gap-1 h-6">
              <Bookmark className="h-3 w-3" /> Presets
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schema" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          <SchemaTab />
        </TabsContent>
        <TabsContent value="history" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="presets" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          <PresetsTab onSaveNew={onSavePreset} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
