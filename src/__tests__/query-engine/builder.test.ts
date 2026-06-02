import { describe, it, expect } from "vitest";
import { buildQuery } from "@/lib/query-engine/builder";
import type { ConditionGroup, Rule, Schema } from "@/lib/query-engine/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const schema: Schema = {
  id: "test", name: "Test", description: "", tableName: "users",
  fields: [
    { key: "name",      label: "Name",    type: "string" },
    { key: "age",       label: "Age",     type: "number" },
    { key: "status",    label: "Status",  type: "enum", enumOptions: ["active","inactive"] },
    { key: "createdAt", label: "Date",    type: "date"   },
    { key: "verified",  label: "Verified",type: "boolean"},
  ],
};

function g(logic: "AND"|"OR", children: (Rule|ConditionGroup)[] = []): ConditionGroup {
  return { id: "g", type: "group", logic, collapsed: false, children };
}
function r(field: string, operator: Rule["operator"], value: Rule["value"]): Rule {
  return { id: "r", type: "rule", field, operator, value };
}

// ─── SQL ──────────────────────────────────────────────────────────────────────

describe("buildQuery – SQL", () => {
  it("empty root returns bare SELECT", () => {
    const { sql } = buildQuery(g("AND"), schema);
    expect(sql).toBe("SELECT * FROM users;");
  });

  it("single equals rule", () => {
    const { sql } = buildQuery(g("AND", [r("name","equals","Alice")]), schema);
    expect(sql).toContain("WHERE");
    expect(sql).toContain("name = 'Alice'");
  });

  it("number greater_than", () => {
    const { sql } = buildQuery(g("AND", [r("age","greater_than",18)]), schema);
    expect(sql).toContain("age > 18");
  });

  it("AND joins two rules", () => {
    const { sql } = buildQuery(g("AND",[r("age","greater_than",18), r("status","equals","active")]), schema);
    expect(sql).toContain("AND");
    expect(sql).toContain("age > 18");
    expect(sql).toContain("status = 'active'");
  });

  it("OR joins two rules", () => {
    const { sql } = buildQuery(g("OR",[r("age","greater_than",18), r("status","equals","inactive")]), schema);
    expect(sql).toContain("OR");
  });

  it("contains → LIKE '%val%'", () => {
    const { sql } = buildQuery(g("AND",[r("name","contains","ali")]), schema);
    expect(sql).toContain("LIKE '%ali%'");
  });

  it("starts_with → LIKE 'val%'", () => {
    const { sql } = buildQuery(g("AND",[r("name","starts_with","Al")]), schema);
    expect(sql).toContain("LIKE 'Al%'");
  });

  it("ends_with → LIKE '%val'", () => {
    const { sql } = buildQuery(g("AND",[r("name","ends_with","ce")]), schema);
    expect(sql).toContain("LIKE '%ce'");
  });

  it("is_null", () => {
    const { sql } = buildQuery(g("AND",[r("age","is_null",null)]), schema);
    expect(sql).toContain("age IS NULL");
  });

  it("is_not_null", () => {
    const { sql } = buildQuery(g("AND",[r("age","is_not_null",null)]), schema);
    expect(sql).toContain("age IS NOT NULL");
  });

  it("in_array → IN (...)", () => {
    const { sql } = buildQuery(g("AND",[r("status","in_array",["active","inactive"])]), schema);
    expect(sql).toContain("IN (");
    expect(sql).toContain("'active'");
    expect(sql).toContain("'inactive'");
  });

  it("between", () => {
    const { sql } = buildQuery(g("AND",[r("age","between",[18,30])]), schema);
    expect(sql).toContain("BETWEEN 18 AND 30");
  });

  it("nested group gets parentheses", () => {
    const inner = { id:"g2", type:"group" as const, logic:"OR" as const, collapsed:false,
      children:[r("age","greater_than",18), r("status","equals","active")] };
    const { sql } = buildQuery(g("AND",[inner]), schema);
    expect(sql).toContain("(");
    expect(sql).toContain("OR");
  });

  it("before/after use < and >", () => {
    const { sql: before } = buildQuery(g("AND",[r("createdAt","before","2024-01-01")]), schema);
    const { sql: after  } = buildQuery(g("AND",[r("createdAt","after", "2024-01-01")]), schema);
    expect(before).toContain("createdAt < '2024-01-01'");
    expect(after ).toContain("createdAt > '2024-01-01'");
  });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────

describe("buildQuery – MongoDB", () => {
  it("empty root returns {}", () => {
    const { mongodb } = buildQuery(g("AND"), schema);
    expect(JSON.parse(mongodb)).toEqual({});
  });

  it("equals rule", () => {
    const { mongodb } = buildQuery(g("AND",[r("status","equals","active")]), schema);
    const obj = JSON.parse(mongodb);
    expect(obj.$and[0].status).toBe("active");
  });

  it("greater_than uses $gt", () => {
    const { mongodb } = buildQuery(g("AND",[r("age","greater_than",18)]), schema);
    const obj = JSON.parse(mongodb);
    expect(obj.$and[0].age.$gt).toBe(18);
  });

  it("OR group uses $or", () => {
    const { mongodb } = buildQuery(g("OR",[r("age","greater_than",18),r("status","equals","active")]), schema);
    const obj = JSON.parse(mongodb);
    expect(obj).toHaveProperty("$or");
  });

  it("in_array uses $in", () => {
    const { mongodb } = buildQuery(g("AND",[r("status","in_array",["active","inactive"])]), schema);
    const obj = JSON.parse(mongodb);
    expect(obj.$and[0].status.$in).toEqual(["active","inactive"]);
  });

  it("contains uses $regex", () => {
    const { mongodb } = buildQuery(g("AND",[r("name","contains","ali")]), schema);
    const obj = JSON.parse(mongodb);
    expect(obj.$and[0].name.$regex).toBe("ali");
  });
});

// ─── GraphQL ─────────────────────────────────────────────────────────────────

describe("buildQuery – GraphQL", () => {
  it("empty root returns query with empty where", () => {
    const { graphql } = buildQuery(g("AND"), schema);
    expect(graphql).toContain("query");
    expect(graphql).toContain("users");
  });

  it("AND group uses _and", () => {
    const { graphql } = buildQuery(g("AND",[r("age","greater_than",18)]), schema);
    expect(graphql).toContain("_and");
  });

  it("OR group uses _or", () => {
    const { graphql } = buildQuery(g("OR",[r("age","greater_than",18)]), schema);
    expect(graphql).toContain("_or");
  });

  it("greater_than uses _gt", () => {
    const { graphql } = buildQuery(g("AND",[r("age","greater_than",18)]), schema);
    expect(graphql).toContain("_gt");
    expect(graphql).toContain("18");
  });

  it("equals uses _eq", () => {
    const { graphql } = buildQuery(g("AND",[r("status","equals","active")]), schema);
    expect(graphql).toContain("_eq");
    expect(graphql).toContain("active");
  });
});
