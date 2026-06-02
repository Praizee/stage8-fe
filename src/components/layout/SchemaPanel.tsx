"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSchemaStore } from "@/store/schema-store";

const TYPE_COLORS: Record<string, string> = {
  string:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  number:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  boolean: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  enum:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  date:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function SchemaPanel() {
  const { activeSchema } = useSchemaStore();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schema</h2>
        <p className="font-medium text-sm mt-0.5">{activeSchema.name}</p>
        <p className="text-xs text-muted-foreground">{activeSchema.description}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {activeSchema.fields.map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/30 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{field.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{field.key}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ml-2 flex-shrink-0 ${TYPE_COLORS[field.type] ?? ""}`}
              >
                {field.type}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {activeSchema.fields.length} fields · table <span className="font-mono">{activeSchema.tableName}</span>
        </p>
      </div>
    </aside>
  );
}
