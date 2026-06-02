import { describe, it, expect } from "vitest";
import { executeQuery } from "@/lib/query-engine/executor";
import type { ConditionGroup, Rule, Schema } from "@/lib/query-engine/types";

const schema: Schema = {
  id: "test", name: "Test", description: "", tableName: "test_table",
  fields: [
    { key: "name",      label: "Name",     type: "string"  },
    { key: "age",       label: "Age",      type: "number"  },
    { key: "status",    label: "Status",   type: "enum", enumOptions: ["active","inactive"] },
    { key: "createdAt", label: "Date",     type: "date"    },
    { key: "verified",  label: "Verified", type: "boolean" },
  ],
};

const data = [
  { name: "Alice",   age: 25, status: "active",   verified: true,  createdAt: "2024-01-15" },
  { name: "Bob",     age: 17, status: "inactive",  verified: false, createdAt: "2023-06-10" },
  { name: "Charlie", age: 30, status: "active",    verified: true,  createdAt: "2024-03-20" },
  { name: "Diana",   age: null, status: "active",  verified: null,  createdAt: "2022-11-01" },
];

function g(logic: "AND"|"OR", children: (Rule|ConditionGroup)[] = []): ConditionGroup {
  return { id: "g", type: "group", logic, collapsed: false, children };
}
function r(field: string, operator: Rule["operator"], value: Rule["value"]): Rule {
  return { id: "r" + Math.random(), type: "rule", field, operator, value };
}

describe("executeQuery", () => {
  it("empty root returns all records", () => {
    const { matched, total } = executeQuery(g("AND"), data, schema);
    expect(matched).toBe(4);
    expect(total).toBe(4);
  });

  it("equals filters correctly", () => {
    const { records } = executeQuery(g("AND",[r("status","equals","active")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie","Diana"]);
  });

  it("not_equals filters correctly", () => {
    const { records } = executeQuery(g("AND",[r("status","not_equals","active")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Bob"]);
  });

  it("greater_than filters correctly", () => {
    const { records } = executeQuery(g("AND",[r("age","greater_than",18)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("less_than filters correctly", () => {
    const { records } = executeQuery(g("AND",[r("age","less_than",18)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Bob"]);
  });

  it("greater_than_or_equal includes boundary", () => {
    const { records } = executeQuery(g("AND",[r("age","greater_than_or_equal",25)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("less_than_or_equal includes boundary", () => {
    const { records } = executeQuery(g("AND",[r("age","less_than_or_equal",17)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Bob"]);
  });

  it("contains (case-insensitive)", () => {
    const { records } = executeQuery(g("AND",[r("name","contains","LI")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("starts_with", () => {
    const { records } = executeQuery(g("AND",[r("name","starts_with","Al")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice"]);
  });

  it("ends_with", () => {
    const { records } = executeQuery(g("AND",[r("name","ends_with","e")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("between (inclusive)", () => {
    const { records } = executeQuery(g("AND",[r("age","between",[18,25])]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice"]);
  });

  it("in_array", () => {
    const { records } = executeQuery(g("AND",[r("status","in_array",["inactive"])]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Bob"]);
  });

  it("not_in_array", () => {
    const { records } = executeQuery(g("AND",[r("status","not_in_array",["inactive"])]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie","Diana"]);
  });

  it("is_null matches null values", () => {
    const { records } = executeQuery(g("AND",[r("age","is_null",null)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Diana"]);
  });

  it("is_not_null excludes null values", () => {
    const { records } = executeQuery(g("AND",[r("age","is_not_null",null)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Bob","Charlie"]);
  });

  it("AND group returns intersection", () => {
    const { records } = executeQuery(
      g("AND",[r("age","greater_than",18), r("status","equals","active")]),
      data, schema
    );
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("OR group returns union", () => {
    const { records } = executeQuery(
      g("OR",[r("age","less_than",18), r("verified","equals",true)]),
      data, schema
    );
    expect(records.map(x=>x.name)).toContain("Bob");
    expect(records.map(x=>x.name)).toContain("Alice");
    expect(records.map(x=>x.name)).toContain("Charlie");
  });

  it("nested group (A AND B) OR C", () => {
    const inner = g("AND",[r("age","greater_than",18), r("status","equals","active")]);
    inner.id = "inner";
    const { records } = executeQuery(
      g("OR",[inner, r("name","equals","Bob")]),
      data, schema
    );
    expect(records.map(x=>x.name)).toContain("Alice");
    expect(records.map(x=>x.name)).toContain("Charlie");
    expect(records.map(x=>x.name)).toContain("Bob");
  });

  it("before date operator", () => {
    const { records } = executeQuery(g("AND",[r("createdAt","before","2024-01-01")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Bob","Diana"]);
  });

  it("after date operator", () => {
    const { records } = executeQuery(g("AND",[r("createdAt","after","2024-01-01")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("regex operator (case insensitive)", () => {
    const { records } = executeQuery(g("AND",[r("name","regex","^al")]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice"]);
  });

  it("boolean equals true", () => {
    const { records } = executeQuery(g("AND",[r("verified","equals",true)]), data, schema);
    expect(records.map(x=>x.name)).toEqual(["Alice","Charlie"]);
  });

  it("matched count is correct", () => {
    const result = executeQuery(g("AND",[r("status","equals","active")]), data, schema);
    expect(result.matched).toBe(3);
    expect(result.total).toBe(4);
  });
});
