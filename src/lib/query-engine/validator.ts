import type { ConditionGroup, QueryNode, Rule, Schema, ValidationError } from "./types";
import { OPERATORS_BY_TYPE, NO_VALUE_OPERATORS, RANGE_OPERATORS, LIST_OPERATORS } from "./types";

// ─── Recursive Validator ─────────────────────────────────────────────────────

function validateNode(node: QueryNode, schema: Schema, errors: ValidationError[]): void {
  if (node.type === "rule") {
    validateRule(node, schema, errors);
  } else {
    validateGroup(node, schema, errors);
  }
}

function validateRule(rule: Rule, schema: Schema, errors: ValidationError[]): void {
  // 1. Field must exist in schema
  const field = schema.fields.find((f) => f.key === rule.field);
  if (!field) {
    errors.push({ nodeId: rule.id, message: `Field "${rule.field}" not found in schema.` });
    return;
  }

  // 2. Operator must be valid for field type
  const validOps = OPERATORS_BY_TYPE[field.type];
  if (!validOps.includes(rule.operator)) {
    errors.push({
      nodeId: rule.id,
      message: `Operator "${rule.operator}" is not valid for ${field.type} field "${field.label}".`,
    });
    return;
  }

  // 3. Value checks (skip for null operators)
  if (NO_VALUE_OPERATORS.includes(rule.operator)) return;

  const v = rule.value;

  if (v === null || v === undefined || v === "") {
    errors.push({ nodeId: rule.id, message: "A value is required." });
    return;
  }

  // 4. Between: must be a 2-element array with valid range
  if (RANGE_OPERATORS.includes(rule.operator)) {
    if (!Array.isArray(v) || v.length < 2) {
      errors.push({ nodeId: rule.id, message: "Between requires two values (min and max)." });
      return;
    }
    if (field.type === "number") {
      if (Number(v[0]) >= Number(v[1])) {
        errors.push({ nodeId: rule.id, message: "Min value must be less than max value." });
      }
    }
    if (field.type === "date") {
      if (new Date(String(v[0])) >= new Date(String(v[1]))) {
        errors.push({ nodeId: rule.id, message: "Start date must be before end date." });
      }
    }
    return;
  }

  // 5. In/Not-in: must be a non-empty array
  if (LIST_OPERATORS.includes(rule.operator)) {
    if (!Array.isArray(v) || v.length === 0) {
      errors.push({ nodeId: rule.id, message: "List must contain at least one value." });
    }
    return;
  }

  // 6. Type-specific value validation
  if (field.type === "number" && isNaN(Number(v))) {
    errors.push({ nodeId: rule.id, message: "Value must be a valid number." });
  }
  if (field.type === "date" && isNaN(Date.parse(String(v)))) {
    errors.push({ nodeId: rule.id, message: "Value must be a valid date." });
  }
  if (field.type === "boolean" && typeof v !== "boolean") {
    errors.push({ nodeId: rule.id, message: "Value must be true or false." });
  }
}

function validateGroup(group: ConditionGroup, schema: Schema, errors: ValidationError[]): void {
  if (group.children.length === 0) {
    errors.push({ nodeId: group.id, message: "Group must contain at least one condition." });
    return;
  }
  for (const child of group.children) {
    validateNode(child, schema, errors);
  }
}

export function validateQuery(root: ConditionGroup, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];
  // Empty root is valid (returns all records)
  if (root.children.length === 0) return errors;
  for (const child of root.children) {
    validateNode(child, schema, errors);
  }
  return errors;
}

/** Returns a Set of node IDs that have errors — useful for highlighting */
export function getErrorNodeIds(errors: ValidationError[]): Set<string> {
  return new Set(errors.map((e) => e.nodeId));
}
