"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, RotateCcw, Download, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { exportQuery } from "@/lib/query-engine/serializer";
import { validateQuery } from "@/lib/query-engine/validator";

interface AppHeaderProps {
  onRun: () => void;
  isRunning: boolean;
}

export function AppHeader({ onRun, isRunning }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { root, resetQuery } = useQueryStore();
  const { schemas, activeSchema, setActiveSchema } = useSchemaStore();

  const hasErrors = validateQuery(root, activeSchema).length > 0;

  function handleExport() {
    const json = exportQuery(root, activeSchema);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-${activeSchema.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSchemaChange(id: string) {
    if (root.children.length > 0) {
      if (!confirm("Switching schema will reset your current query. Continue?")) return;
    }
    setActiveSchema(id);
    resetQuery();
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-2">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">QueryCraft</span>
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Schema selector */}
      <div className="flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={activeSchema.id} onValueChange={handleSchemaChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schemas.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                <span className="flex flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground text-[10px]">{s.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Export query JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (root.children.length > 0 && !confirm("Reset all conditions?")) return;
                resetQuery();
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Reset query</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Toggle theme</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          id="run-query-btn"
          size="sm"
          className="h-8 text-xs gap-1.5 font-semibold"
          onClick={onRun}
          disabled={isRunning || hasErrors}
        >
          <Zap className="h-3.5 w-3.5" />
          {isRunning ? "Running…" : "Run Query"}
        </Button>
      </div>
    </header>
  );
}
