import { describe, it, expect } from "vitest";
import { exportQuery, importQuery } from "@/lib/query-engine/serializer";
import type { ConditionGroup, Schema } from "@/lib/query-engine/types";

const schema: Schema = {
  id: "users", name: "Users", description: "", tableName: "users",
  fields: [{ key: "age", label: "Age", type: "number" }],
};

const tree: ConditionGroup = {
  id: "root", type: "group", logic: "AND", collapsed: false,
  children: [{ id: "r1", type: "rule", field: "age", operator: "greater_than", value: 18 }],
};

describe("serializer", () => {
  it("exportQuery produces valid JSON", () => {
    const json = exportQuery(tree, schema);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("exported payload has correct structure", () => {
    const json = exportQuery(tree, schema);
    const payload = JSON.parse(json);
    expect(payload.version).toBe(1);
    expect(payload.schemaId).toBe("users");
    expect(payload.tree.type).toBe("group");
    expect(typeof payload.exportedAt).toBe("string");
  });

  it("importQuery round-trips correctly", () => {
    const json = exportQuery(tree, schema);
    const result = importQuery(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.schemaId).toBe("users");
      expect(result.payload.tree.children).toHaveLength(1);
    }
  });

  it("importQuery rejects invalid JSON", () => {
    const result = importQuery("not json {{{");
    expect(result.ok).toBe(false);
  });

  it("importQuery rejects wrong version", () => {
    const result = importQuery(JSON.stringify({ version: 99, schemaId: "x", tree: {} }));
    expect(result.ok).toBe(false);
  });

  it("importQuery rejects missing schemaId", () => {
    const result = importQuery(JSON.stringify({ version: 1, tree: { type:"group", id:"g", logic:"AND", collapsed:false, children:[] } }));
    expect(result.ok).toBe(false);
  });

  it("importQuery rejects malformed tree", () => {
    const result = importQuery(JSON.stringify({ version: 1, schemaId: "users", tree: { type: "rule" } }));
    expect(result.ok).toBe(false);
  });
});
