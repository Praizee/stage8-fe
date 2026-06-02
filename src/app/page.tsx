"use client";
import { useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SchemaPanel } from "@/components/layout/SchemaPanel";
import { QueryBuilder } from "@/components/query-builder/QueryBuilder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2, TableProperties } from "lucide-react";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 300));
    setIsRunning(false);
    // Phases 4 & 5 will wire actual execution here
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader onRun={handleRun} isRunning={isRunning} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Schema panel */}
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

        {/* Right: Preview + Results (Phase 4 & 5 placeholder) */}
        <aside className="w-[380px] flex-shrink-0 border-l border-border flex flex-col">
          {/* Preview placeholder */}
          <div className="flex-1 flex flex-col border-b border-border">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Query Preview
              </h2>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <Code2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Preview coming in Phase 4</p>
                <p className="text-xs text-muted-foreground/60">
                  SQL · MongoDB · GraphQL
                </p>
              </div>
            </div>
          </div>

          {/* Results placeholder */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <TableProperties className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </h2>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <TableProperties className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Run your query to see results</p>
                <p className="text-xs text-muted-foreground/60">
                  Mock data · Pagination · Sorting
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
