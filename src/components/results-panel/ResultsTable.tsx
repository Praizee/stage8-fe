"use client";
import React, { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Schema } from "@/lib/query-engine/types";

interface ResultsTableProps {
  records: Record<string, unknown>[];
  schema: Schema;
}

const PAGE_SIZE = 25;

// ─── Cell formatting ──────────────────────────────────────────────────────────

function formatCell(value: unknown, fieldType: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40 italic text-[10px]">null</span>;
  }
  if (fieldType === "boolean") {
    return value ? (
      <span className="text-emerald-400 font-mono text-[11px]">true</span>
    ) : (
      <span className="text-rose-400 font-mono text-[11px]">false</span>
    );
  }
  if (fieldType === "date") {
    try {
      return new Date(String(value)).toLocaleDateString("en-GB", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return String(value); }
  }
  if (fieldType === "number") {
    const n = Number(value);
    return isNaN(n) ? String(value) : n.toLocaleString();
  }
  if (fieldType === "enum") {
    return (
      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4">
        {String(value)}
      </Badge>
    );
  }
  const str = String(value);
  return str.length > 40 ? str.slice(0, 40) + "…" : str;
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string;
  fieldKey: string;
  sortCol: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
}

function SortHeader({ label, fieldKey, sortCol, sortDir, onSort }: SortHeaderProps) {
  const active = sortCol === fieldKey;
  return (
    <th
      className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors group"
      onClick={() => onSort(fieldKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-primary" />
          ) : (
            <ChevronDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </span>
    </th>
  );
}

// ─── ResultsTable ─────────────────────────────────────────────────────────────

export const ResultsTable = React.memo(function ResultsTable({
  records,
  schema,
}: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback((key: string) => {
    setSortCol((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
    setPage(0);
  }, []);

  const sorted = useMemo(() => {
    if (!sortCol) return records;
    const field = schema.fields.find((f) => f.key === sortCol);
    return [...records].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      let cmp = 0;
      if (field?.type === "number") {
        cmp = Number(av) - Number(bv);
      } else if (field?.type === "date") {
        cmp = new Date(String(av)).getTime() - new Date(String(bv)).getTime();
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortCol, sortDir, schema]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRecords = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, sorted.length);

  const fieldTypeMap = useMemo(
    () => Object.fromEntries(schema.fields.map((f) => [f.key, f.type])),
    [schema]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1" orientation="horizontal">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              {schema.fields.map((field) => (
                <SortHeader
                  key={field.key}
                  label={field.label}
                  fieldKey={field.key}
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((record, i) => (
              <tr
                key={String(record.id ?? i)}
                className="border-b border-border/50 hover:bg-accent/20 transition-colors"
              >
                {schema.fields.map((field) => (
                  <td key={field.key} className="px-3 py-1.5 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis">
                    {formatCell(record[field.key], fieldTypeMap[field.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {start}–{end} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-[10px] text-muted-foreground px-1">
              {page + 1}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
