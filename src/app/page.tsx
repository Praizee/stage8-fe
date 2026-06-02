"use client";
import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SchemaPanel } from "@/components/layout/SchemaPanel";
import { QueryBuilder } from "@/components/query-builder/QueryBuilder";
import { QueryPreview } from "@/components/query-preview/QueryPreview";
import { ResultsPanel } from "@/components/results-panel/ResultsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { useUIStore } from "@/store/ui-store";
import { executeQueryAsync, type ExecuteResult } from "@/lib/query-engine/executor";
import { validateQuery } from "@/lib/query-engine/validator";
import { DATASET_MAP } from "@/lib/mock-data";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);

  const addHistory = useUIStore((s) => s.addHistory);

  const handleRun = useCallback(async () => {
    // Read latest store state at call time (avoids stale closure)
    const root = useQueryStore.getState().root;
    const schema = useSchemaStore.getState().activeSchema;

    // Block if there are validation errors
    const errors = validateQuery(root, schema);
    if (errors.length > 0) return;

    setIsRunning(true);
    setHasRun(false);

    const dataset = DATASET_MAP[schema.id] ?? [];
    const execResult = await executeQueryAsync(root, dataset, schema, 220);

    setResult(execResult);
    setHasRun(true);
    setIsRunning(false);

    addHistory({
      tree: root,
      schemaId: schema.id,
      resultCount: execResult.matched,
    });
  }, [addHistory]);

  // Keyboard shortcut: Ctrl/Cmd + Enter = run query
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  // Reset results when schema changes
  const activeSchemaId = useSchemaStore((s) => s.activeSchema.id);
  useEffect(() => {
    setResult(null);
    setHasRun(false);
  }, [activeSchemaId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader onRun={handleRun} isRunning={isRunning} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Schema reference panel */}
        <SchemaPanel />

        {/* Center: Query builder */}
        <ScrollArea className="flex-1">
          <main className="p-6 space-y-4 min-h-full">
            <div>
              <h1 className="text-lg font-semibold">Query Builder</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Build conditions visually — add rules, nest groups, and run against live data.
              </p>
            </div>
            <QueryBuilder />
          </main>
        </ScrollArea>

        {/* Right: Preview (top) + Results (bottom) */}
        <aside className="w-[400px] flex-shrink-0 border-l border-border flex flex-col">
          {/* Live query preview */}
          <div className="flex-[50] min-h-0 flex flex-col border-b border-border">
            <QueryPreview />
          </div>

          {/* Results */}
          <div className="flex-[50] min-h-0 flex flex-col">
            <ResultsPanel result={result} isRunning={isRunning} hasRun={hasRun} />
          </div>
        </aside>
      </div>
    </div>
  );
}
