"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { useUIStore } from "@/store/ui-store";

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function SavePresetDialog({ open, onOpenChange }: SavePresetDialogProps) {
  const [name, setName] = useState("");
  const { savePreset } = useUIStore();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const root = useQueryStore.getState().root;
    const schema = useSchemaStore.getState().activeSchema;
    savePreset(trimmed, root, schema.id);
    setName("");
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onOpenChange(false);
  }

  const root = useQueryStore((s) => s.root);
  const activeSchema = useSchemaStore((s) => s.activeSchema);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setName(""); onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Save Preset
          </DialogTitle>
          <DialogDescription>
            Give this query a name to save it for later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Badge variant="outline" className="text-[10px] h-4 px-1">{activeSchema.name}</Badge>
            <span>{root.children.length} condition{root.children.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preset-name" className="text-xs">Preset name</Label>
            <Input
              id="preset-name"
              autoFocus
              placeholder="e.g. Active Nigerian Users"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!name.trim()} onClick={handleSave}>Save Preset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
