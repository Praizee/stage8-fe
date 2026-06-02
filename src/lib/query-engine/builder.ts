import type {
  ConditionGroup,
  GeneratedQuery,
  QueryNode,
  Rule,
  RuleValue,
  Schema,
  SchemaField,
} from "./types";

// ─── SQL Generator ───────────────────────────────────────────────────────────

function sqlQuote(value: RuleValue, field: SchemaField): string {
  if (value === null) return "NULL";
  if (field.type === "boolean") return value ? "TRUE" : "FALSE";
  if (field.type === "number") return String(Number(value));
  return `'${String(value).replace(/'/g, "''")}'`;
}

function ruleToSQL(rule: Rule, schema: Schema): string {
  const field = schema.fields.find((f) => f.key === rule.field);
  if (!field) return "/* unknown field */";
  const col = rule.field;
  const v = rule.value;

  switch (rule.operator) {
    case "equals":              return `${col} = ${sqlQuote(v, field)}`;
    case "not_equals":         return `${col} != ${sqlQuote(v, field)}`;
    case "greater_than":       return `${col} > ${v}`;
    case "less_than":          return `${col} < ${v}`;
    case "greater_than_or_equal": return `${col} >= ${v}`;
    case "less_than_or_equal": return `${col} <= ${v}`;
    case "contains":           return `${col} LIKE '%${v}%'`;
    case "starts_with":        return `${col} LIKE '${v}%'`;
    case "ends_with":          return `${col} LIKE '%${v}'`;
    case "regex":              return `${col} REGEXP '${v}'`;
    case "is_null":            return `${col} IS NULL`;
    case "is_not_null":        return `${col} IS NOT NULL`;
    case "before":             return `${col} < ${sqlQuote(v, field)}`;
    case "after":              return `${col} > ${sqlQuote(v, field)}`;
    case "in_array": {
      const arr = (Array.isArray(v) ? v : [v]).map((x) => sqlQuote(x as RuleValue, field));
      return `${col} IN (${arr.join(", ")})`;
    }
    case "not_in_array": {
      const arr = (Array.isArray(v) ? v : [v]).map((x) => sqlQuote(x as RuleValue, field));
      return `${col} NOT IN (${arr.join(", ")})`;
    }
    case "between": {
      const [lo, hi] = Array.isArray(v) ? v : [v, v];
      return `${col} BETWEEN ${sqlQuote(lo as RuleValue, field)} AND ${sqlQuote(hi as RuleValue, field)}`;
    }
    default: return "/* unsupported */";
  }
}

function groupToSQL(group: ConditionGroup, schema: Schema, depth = 0): string {
  if (group.children.length === 0) return depth === 0 ? "/* empty query */" : "";
  const parts = group.children
    .map((child) => nodeToSQL(child, schema, depth + 1))
    .filter(Boolean);
  if (parts.length === 0) return "";
  const joined = parts.join(`\n${"  ".repeat(depth)}${group.logic} `);
  return depth === 0 ? joined : `(${joined})`;
}

function nodeToSQL(node: QueryNode, schema: Schema, depth: number): string {
  return node.type === "rule" ? ruleToSQL(node, schema) : groupToSQL(node, schema, depth);
}

function buildSQL(root: ConditionGroup, schema: Schema): string {
  const where = groupToSQL(root, schema, 0);
  if (!where || where === "/* empty query */") {
    return `SELECT * FROM ${schema.tableName};`;
  }
  return `SELECT *\nFROM ${schema.tableName}\nWHERE ${where};`;
}

// ─── MongoDB Generator ───────────────────────────────────────────────────────

function ruleToMongo(rule: Rule): Record<string, unknown> {
  const col = rule.field;
  const v = rule.value;

  switch (rule.operator) {
    case "equals":              return { [col]: v };
    case "not_equals":         return { [col]: { $ne: v } };
    case "greater_than":       return { [col]: { $gt: v } };
    case "less_than":          return { [col]: { $lt: v } };
    case "greater_than_or_equal": return { [col]: { $gte: v } };
    case "less_than_or_equal": return { [col]: { $lte: v } };
    case "contains":           return { [col]: { $regex: v, $options: "i" } };
    case "starts_with":        return { [col]: { $regex: `^${v}`, $options: "i" } };
    case "ends_with":          return { [col]: { $regex: `${v}$`, $options: "i" } };
    case "regex":              return { [col]: { $regex: v } };
    case "is_null":            return { [col]: { $exists: false } };
    case "is_not_null":        return { [col]: { $exists: true } };
    case "in_array":           return { [col]: { $in: Array.isArray(v) ? v : [v] } };
    case "not_in_array":       return { [col]: { $nin: Array.isArray(v) ? v : [v] } };
    case "before":             return { [col]: { $lt: v } };
    case "after":              return { [col]: { $gt: v } };
    case "between": {
      const [lo, hi] = Array.isArray(v) ? v : [v, v];
      return { [col]: { $gte: lo, $lte: hi } };
    }
    default: return {};
  }
}

function groupToMongo(group: ConditionGroup): Record<string, unknown> {
  if (group.children.length === 0) return {};
  const parts = group.children.map(nodeToMongo);
  const key = group.logic === "AND" ? "$and" : "$or";
  return { [key]: parts };
}

function nodeToMongo(node: QueryNode): Record<string, unknown> {
  return node.type === "rule" ? ruleToMongo(node) : groupToMongo(node);
}

function buildMongoDB(root: ConditionGroup): string {
  const filter = groupToMongo(root);
  return JSON.stringify(filter, null, 2);
}

// ─── GraphQL Generator ───────────────────────────────────────────────────────

function ruleToGQL(rule: Rule, indent: string): string {
  const col = rule.field;
  const v = rule.value;
  const i = indent + "  ";

  const gqlOp: Partial<Record<string, string>> = {
    equals: "_eq", not_equals: "_neq",
    greater_than: "_gt", less_than: "_lt",
    greater_than_or_equal: "_gte", less_than_or_equal: "_lte",
    contains: "_ilike", starts_with: "_ilike", ends_with: "_ilike",
    regex: "_regex",
    is_null: "_is_null", is_not_null: "_is_null",
    in_array: "_in", not_in_array: "_nin",
    before: "_lt", after: "_gt",
  };

  if (rule.operator === "is_null")     return `${i}${col}: { _is_null: true }`;
  if (rule.operator === "is_not_null") return `${i}${col}: { _is_null: false }`;
  if (rule.operator === "between") {
    const [lo, hi] = Array.isArray(v) ? v : [v, v];
    return `${i}${col}: { _gte: ${JSON.stringify(lo)}, _lte: ${JSON.stringify(hi)} }`;
  }
  if (rule.operator === "contains") return `${i}${col}: { _ilike: ${JSON.stringify(`%${v}%`)} }`;
  if (rule.operator === "starts_with") return `${i}${col}: { _ilike: ${JSON.stringify(`${v}%`)} }`;
  if (rule.operator === "ends_with")  return `${i}${col}: { _ilike: ${JSON.stringify(`%${v}`)} }`;

  const op = gqlOp[rule.operator] ?? "_eq";
  const formatted = Array.isArray(v) ? JSON.stringify(v) : JSON.stringify(v);
  return `${i}${col}: { ${op}: ${formatted} }`;
}

function groupToGQL(group: ConditionGroup, indent: string): string {
  if (group.children.length === 0) return "";
  const i = indent + "  ";
  const key = group.logic === "AND" ? "_and" : "_or";
  const parts = group.children.map((child) =>
    child.type === "rule"
      ? `${i}{\n${ruleToGQL(child, i)}\n${i}}`
      : `${i}{\n${groupToGQL(child, i)}\n${i}}`
  );
  return `${i}${key}: [\n${parts.join(",\n")}\n${indent}]`;
}

function buildGraphQL(root: ConditionGroup, schema: Schema): string {
  if (root.children.length === 0) {
    return `query {\n  ${schema.tableName}(where: {}) {\n    id\n  }\n}`;
  }
  const where = groupToGQL(root, "  ");
  return `query {\n  ${schema.tableName}(\n    where: {\n${where}\n    }\n  ) {\n    id\n  }\n}`;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function buildQuery(root: ConditionGroup, schema: Schema): GeneratedQuery {
  return {
    sql:      buildSQL(root, schema),
    mongodb:  buildMongoDB(root),
    graphql:  buildGraphQL(root, schema),
  };
}
