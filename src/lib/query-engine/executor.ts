import type { ConditionGroup, QueryNode, Rule, RuleValue, Schema, SchemaField } from "./types";

// ─── Rule Evaluator ──────────────────────────────────────────────────────────

type DataRecord = Record<string, unknown>;

function evaluateRule(rule: Rule, record: DataRecord, field: SchemaField): boolean {
  const rv = record[rule.field];
  const qv = rule.value;

  switch (rule.operator) {
    case "equals":    return rv === qv;
    case "not_equals": return rv !== qv;

    case "greater_than":          return Number(rv) > Number(qv);
    case "less_than":             return Number(rv) < Number(qv);
    case "greater_than_or_equal": return Number(rv) >= Number(qv);
    case "less_than_or_equal":    return Number(rv) <= Number(qv);

    case "contains":    return String(rv).toLowerCase().includes(String(qv).toLowerCase());
    case "starts_with": return String(rv).toLowerCase().startsWith(String(qv).toLowerCase());
    case "ends_with":   return String(rv).toLowerCase().endsWith(String(qv).toLowerCase());

    case "regex": {
      try { return new RegExp(String(qv), "i").test(String(rv)); }
      catch { return false; }
    }

    case "is_null":     return rv === null || rv === undefined;
    case "is_not_null": return rv !== null && rv !== undefined;

    case "in_array": {
      const list = Array.isArray(qv) ? qv : [qv];
      return list.some((x) => x === rv);
    }
    case "not_in_array": {
      const list = Array.isArray(qv) ? qv : [qv];
      return !list.some((x) => x === rv);
    }

    case "between": {
      const [lo, hi] = Array.isArray(qv) ? qv : [qv, qv];
      if (field.type === "date") {
        const d = new Date(String(rv)).getTime();
        return d >= new Date(String(lo)).getTime() && d <= new Date(String(hi)).getTime();
      }
      return Number(rv) >= Number(lo) && Number(rv) <= Number(hi);
    }
    case "before": {
      if (field.type === "date") return new Date(String(rv)) < new Date(String(qv));
      return Number(rv) < Number(qv);
    }
    case "after": {
      if (field.type === "date") return new Date(String(rv)) > new Date(String(qv));
      return Number(rv) > Number(qv);
    }

    default: return true;
  }
}

// ─── Node Evaluator ──────────────────────────────────────────────────────────

function evaluateNode(node: QueryNode, record: DataRecord, schema: Schema): boolean {
  if (node.type === "rule") {
    const field = schema.fields.find((f) => f.key === node.field);
    if (!field) return false;
    return evaluateRule(node, record, field);
  }
  // group
  if (node.children.length === 0) return true;
  return node.logic === "AND"
    ? node.children.every((c) => evaluateNode(c, record, schema))
    : node.children.some((c) => evaluateNode(c, record, schema));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface ExecuteResult {
  records: DataRecord[];
  total: number;
  matched: number;
}

export function executeQuery(
  root: ConditionGroup,
  dataset: DataRecord[],
  schema: Schema
): ExecuteResult {
  if (root.children.length === 0) {
    return { records: dataset, total: dataset.length, matched: dataset.length };
  }
  const records = dataset.filter((r) => evaluateNode(root, r, schema));
  return { records, total: dataset.length, matched: records.length };
}

// Helper used by the mock "loading" UX in Phase 5
export function executeQueryAsync(
  root: ConditionGroup,
  dataset: DataRecord[],
  schema: Schema,
  delayMs = 200
): Promise<ExecuteResult> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(executeQuery(root, dataset, schema)), delayMs)
  );
}
