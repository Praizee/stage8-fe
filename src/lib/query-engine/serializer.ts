import type { ConditionGroup, QueryPreset, Schema } from "./types";

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportPayload {
  version: 1;
  schemaId: string;
  exportedAt: string;
  tree: ConditionGroup;
}

export function exportQuery(tree: ConditionGroup, schema: Schema): string {
  const payload: ExportPayload = {
    version: 1,
    schemaId: schema.id,
    exportedAt: new Date().toISOString(),
    tree,
  };
  return JSON.stringify(payload, null, 2);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  ok: true;
  payload: ExportPayload;
}
export interface ImportError {
  ok: false;
  error: string;
}

export function importQuery(json: string): ImportResult | ImportError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON — could not parse file." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Invalid format — expected a JSON object." };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    return { ok: false, error: `Unsupported version: ${obj.version}` };
  }
  if (typeof obj.schemaId !== "string") {
    return { ok: false, error: "Missing or invalid schemaId." };
  }
  if (!isConditionGroup(obj.tree)) {
    return { ok: false, error: "Invalid query tree structure." };
  }

  return { ok: true, payload: obj as unknown as ExportPayload };
}

// ─── Preset serialization ─────────────────────────────────────────────────────

export function exportPresets(presets: QueryPreset[]): string {
  return JSON.stringify({ version: 1, presets }, null, 2);
}

export function importPresets(json: string): { ok: true; presets: QueryPreset[] } | { ok: false; error: string } {
  try {
    const obj = JSON.parse(json) as { presets: QueryPreset[] };
    if (!Array.isArray(obj.presets)) return { ok: false, error: "Expected a presets array." };
    return { ok: true, presets: obj.presets };
  } catch {
    return { ok: false, error: "Could not parse JSON." };
  }
}

// ─── Validation helper ────────────────────────────────────────────────────────

function isConditionGroup(val: unknown): val is ConditionGroup {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    obj.type === "group" &&
    typeof obj.id === "string" &&
    (obj.logic === "AND" || obj.logic === "OR") &&
    Array.isArray(obj.children)
  );
}
