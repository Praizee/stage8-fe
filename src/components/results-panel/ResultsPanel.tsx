"use client";
import { TableProperties, Loader2, SearchX, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResultsTable } from "./ResultsTable";
import { useSchemaStore } from "@/store/schema-store";
import type { ExecuteResult } from "@/lib/query-engine/executor";

interface ResultsPanelProps {
  result: ExecuteResult | null;
  isRunning: boolean;
  hasRun: boolean;
}

// ─── States ───────────────────────────────────────────────────────────────────

function IdleState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <PlayCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">No results yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click <strong>Run Query</strong> or press{" "}
          <kbd className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded border border-border">
            Ctrl+↵
          </kbd>{" "}
          to execute
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-6 w-6 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Executing query…</p>
    </div>
  );
}

function EmptyState({ total }: { total: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <SearchX className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No matching records</p>
        <p className="text-xs text-muted-foreground mt-1">
          0 of {total} records matched your conditions
        </p>
      </div>
    </div>
  );
}

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

export function ResultsPanel({ result, isRunning, hasRun }: ResultsPanelProps) {
  const activeSchema = useSchemaStore((s) => s.activeSchema);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <TableProperties className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Results
        </h2>

        {result && !isRunning && (
          <div className="ml-auto flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-4 ${
                result.matched === 0
                  ? "text-muted-foreground"
                  : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
              }`}
            >
              {result.matched.toLocaleString()} / {result.total.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>

      {/* Body */}
      {isRunning ? (
        <LoadingState />
      ) : !hasRun || result === null ? (
        <IdleState />
      ) : result.matched === 0 ? (
        <EmptyState total={result.total} />
      ) : (
        <div className="flex-1 min-h-0">
          <ResultsTable records={result.records} schema={activeSchema} />
        </div>
      )}
    </div>
  );
}
