"use client";
import React, { useMemo, useState, useCallback } from "react";
import { Copy, Check, Code2, Braces, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { useUIStore } from "@/store/ui-store";
import { buildQuery } from "@/lib/query-engine/builder";
import { highlight } from "@/lib/query-engine/highlighter";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {copied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Code block ──────────────────────────────────────────────────────────────

function CodeBlock({
  code,
  lang,
}: {
  code: string;
  lang: "sql" | "mongodb" | "graphql";
}) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <ScrollArea className="h-full">
        <pre
          className="p-4 text-xs leading-relaxed font-mono text-foreground/90 whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </ScrollArea>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Code2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">No query yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Add conditions to see the generated query
        </p>
      </div>
    </div>
  );
}

// ─── QueryPreview ─────────────────────────────────────────────────────────────

const TAB_ICONS = {
  sql:      <Code2 className="h-3 w-3" />,
  mongodb:  <Braces className="h-3 w-3" />,
  graphql:  <GitBranch className="h-3 w-3" />,
};

export function QueryPreview() {
  const root = useQueryStore((s) => s.root);
  const activeSchema = useSchemaStore((s) => s.activeSchema);
  const { activePreviewTab, setActivePreviewTab } = useUIStore();

  // Debounce tree changes so we don't re-generate on every keystroke
  const debouncedRoot = useDebounce(root, 150);
  const debouncedSchema = useDebounce(activeSchema, 150);

  const query = useMemo(
    () => buildQuery(debouncedRoot, debouncedSchema),
    [debouncedRoot, debouncedSchema]
  );

  const isEmpty = debouncedRoot.children.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Query Preview
        </h2>
        {!isEmpty && (
          <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full font-medium">
            LIVE
          </span>
        )}
      </div>

      {isEmpty ? (
        <EmptyPreview />
      ) : (
        <Tabs
          value={activePreviewTab}
          onValueChange={(v) => setActivePreviewTab(v as "sql" | "mongodb" | "graphql")}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-3 pt-2 flex-shrink-0">
            <TabsList className="h-7 w-full">
              {(["sql", "mongodb", "graphql"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 text-[11px] gap-1 h-6"
                >
                  {TAB_ICONS[tab]}
                  {tab === "mongodb" ? "Mongo" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {(["sql", "mongodb", "graphql"] as const).map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="flex-1 min-h-0 bg-muted/30 m-2 rounded-lg border border-border overflow-hidden">
                <CodeBlock
                  code={query[tab]}
                  lang={tab}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
