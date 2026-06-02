"use client";
import { useState, useRef } from "react";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { importQuery } from "@/lib/query-engine/serializer";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { loadQuery } = useQueryStore();
  const { setActiveSchema, schemas } = useSchemaStore();

  function handleImport() {
    setError("");
    const result = importQuery(json);
    if (!result.ok) { setError(result.error); return; }

    const { tree, schemaId } = result.payload;
    const targetSchema = schemas.find((s) => s.id === schemaId);
    if (!targetSchema) {
      setError(`Schema "${schemaId}" not found. Available: ${schemas.map((s) => s.id).join(", ")}`);
      return;
    }

    const current = useQueryStore.getState().root;
    if (current.children.length > 0 && !confirm("Import will replace your current query. Continue?")) return;

    setActiveSchema(schemaId);
    loadQuery(tree);
    setJson("");
    onOpenChange(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setJson(String(ev.target?.result ?? "")); setError(""); };
    reader.readAsText(file);
  }

  function handleClose(o: boolean) {
    if (!o) { setJson(""); setError(""); }
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Import Query
          </DialogTitle>
          <DialogDescription>
            Paste exported JSON or upload a <code>.json</code> file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            className="w-full h-48 text-xs font-mono bg-muted border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            placeholder={'{\n  "version": 1,\n  "schemaId": "users",\n  "tree": { ... }\n}'}
            value={json}
            onChange={(e) => { setJson(e.target.value); setError(""); }}
            spellCheck={false}
          />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Upload file
            </Button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
            {json && <span className="text-[10px] text-muted-foreground">{json.length} chars loaded</span>}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
          <Button size="sm" disabled={!json.trim()} onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
