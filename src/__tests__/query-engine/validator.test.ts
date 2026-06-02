import { describe, it, expect } from "vitest";
import { validateQuery } from "@/lib/query-engine/validator";
import type { ConditionGroup, Rule, Schema } from "@/lib/query-engine/types";

const schema: Schema = {
  id: "test", name: "Test", description: "", tableName: "test_table",
  fields: [
    { key: "name",      label: "Name",    type: "string" },
    { key: "age",       label: "Age",     type: "number" },
    { key: "status",    label: "Status",  type: "enum", enumOptions: ["active","inactive"] },
    { key: "createdAt", label: "Date",    type: "date"   },
    { key: "verified",  label: "Verified",type: "boolean"},
  ],
};

function g(logic: "AND"|"OR", children: (Rule|ConditionGroup)[] = []): ConditionGroup {
  return { id: "g1", type: "group", logic, collapsed: false, children };
}
function r(id: string, field: string, operator: Rule["operator"], value: Rule["value"]): Rule {
  return { id, type: "rule", field, operator, value };
}

describe("validateQuery", () => {
  it("empty root has no errors", () => {
    expect(validateQuery(g("AND"), schema)).toHaveLength(0);
  });

  it("valid single rule has no errors", () => {
    const errors = validateQuery(g("AND", [r("r1","age","greater_than",18)]), schema);
    expect(errors).toHaveLength(0);
  });

  it("missing field returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","","equals","")]), schema);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].nodeId).toBe("r1");
  });

  it("unknown field returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","nonexistent","equals","val")]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("contains on a number field returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","age","contains","18")]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("regex on a number field returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","age","regex","\\d+")]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("empty value returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","name","equals","")]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("null value returns error (non-null-check operator)", () => {
    const errors = validateQuery(g("AND", [r("r1","age","greater_than",null)]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("is_null needs no value – no error", () => {
    const errors = validateQuery(g("AND", [r("r1","age","is_null",null)]), schema);
    expect(errors).toHaveLength(0);
  });

  it("is_not_null needs no value – no error", () => {
    const errors = validateQuery(g("AND", [r("r1","verified","is_not_null",null)]), schema);
    expect(errors).toHaveLength(0);
  });

  it("between with single value returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","age","between",18)]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("between with min >= max returns error for numbers", () => {
    const errors = validateQuery(g("AND", [r("r1","age","between",[30,18])]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("valid between has no errors", () => {
    const errors = validateQuery(g("AND", [r("r1","age","between",[18,30])]), schema);
    expect(errors).toHaveLength(0);
  });

  it("in_array with empty array returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","status","in_array",[])]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("in_array with values has no error", () => {
    const errors = validateQuery(g("AND", [r("r1","status","in_array",["active"])]), schema);
    expect(errors).toHaveLength(0);
  });

  it("empty nested group returns error", () => {
    const emptyGroup: ConditionGroup = { id:"g2", type:"group", logic:"AND", collapsed:false, children:[] };
    const errors = validateQuery(g("AND", [emptyGroup]), schema);
    expect(errors.some(e => e.nodeId === "g2")).toBe(true);
  });

  it("multiple errors are all reported", () => {
    const rules = [
      r("r1","","equals",""),    // missing field
      r("r2","age","equals",null), // missing value
    ];
    const errors = validateQuery(g("AND", rules), schema);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("date field with invalid date returns error", () => {
    const errors = validateQuery(g("AND", [r("r1","createdAt","equals","not-a-date")]), schema);
    expect(errors.some(e => e.nodeId === "r1")).toBe(true);
  });

  it("valid date has no error", () => {
    const errors = validateQuery(g("AND", [r("r1","createdAt","before","2024-01-01")]), schema);
    expect(errors).toHaveLength(0);
  });
});
