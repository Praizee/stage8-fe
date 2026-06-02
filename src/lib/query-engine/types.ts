// ─── Field & Schema Types ───────────────────────────────────────────────────

export type FieldType = "string" | "number" | "boolean" | "enum" | "date";

export type Operator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "in_array"
  | "not_in_array"
  | "between"
  | "is_null"
  | "is_not_null"
  | "regex"
  | "before"
  | "after";

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  enumOptions?: string[];
}

export interface Schema {
  id: string;
  name: string;
  description: string;
  tableName: string;
  fields: SchemaField[];
}

// ─── Query Tree ──────────────────────────────────────────────────────────────

export type RuleValue = string | number | boolean | null | (string | number)[];

export interface Rule {
  id: string;
  type: "rule";
  field: string;
  operator: Operator;
  value: RuleValue;
}

export interface ConditionGroup {
  id: string;
  type: "group";
  logic: "AND" | "OR";
  collapsed: boolean;
  children: QueryNode[];
}

export type QueryNode = Rule | ConditionGroup;

// ─── Query Output ────────────────────────────────────────────────────────────

export interface GeneratedQuery {
  sql: string;
  mongodb: string;
  graphql: string;
}

export interface ValidationError {
  nodeId: string;
  message: string;
}

// ─── History & Presets ───────────────────────────────────────────────────────

export interface QueryPreset {
  id: string;
  name: string;
  createdAt: string;
  tree: ConditionGroup;
  schemaId: string;
}

export interface QueryHistoryEntry {
  id: string;
  executedAt: string;
  tree: ConditionGroup;
  schemaId: string;
  resultCount: number;
}

// ─── Operator Metadata ───────────────────────────────────────────────────────

export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: "equals",
  not_equals: "not equals",
  contains: "contains",
  starts_with: "starts with",
  ends_with: "ends with",
  greater_than: "greater than",
  less_than: "less than",
  greater_than_or_equal: "≥",
  less_than_or_equal: "≤",
  in_array: "in list",
  not_in_array: "not in list",
  between: "between",
  is_null: "is null",
  is_not_null: "is not null",
  regex: "matches regex",
  before: "before",
  after: "after",
};

export const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  string: [
    "equals", "not_equals", "contains", "starts_with", "ends_with",
    "in_array", "not_in_array", "is_null", "is_not_null", "regex",
  ],
  number: [
    "equals", "not_equals", "greater_than", "less_than",
    "greater_than_or_equal", "less_than_or_equal",
    "between", "in_array", "not_in_array", "is_null", "is_not_null",
  ],
  boolean: ["equals", "not_equals", "is_null", "is_not_null"],
  enum: ["equals", "not_equals", "in_array", "not_in_array", "is_null", "is_not_null"],
  date: ["equals", "not_equals", "before", "after", "between", "is_null", "is_not_null"],
};

/** Operators that don't require a value input */
export const NO_VALUE_OPERATORS: Operator[] = ["is_null", "is_not_null"];
/** Operators that require a range (2-element array) input */
export const RANGE_OPERATORS: Operator[] = ["between"];
/** Operators that require a list (array) input */
export const LIST_OPERATORS: Operator[] = ["in_array", "not_in_array"];
