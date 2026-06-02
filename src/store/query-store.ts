import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { ConditionGroup, QueryNode, Rule, Operator, RuleValue } from "@/lib/query-engine/types";

// ─── Helpers (work on mutable Immer drafts) ───────────────────────────────────

function findGroup(node: ConditionGroup, id: string): ConditionGroup | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    if (child.type === "group") {
      const found = findGroup(child, id);
      if (found) return found;
    }
  }
  return null;
}

function findParentGroup(root: ConditionGroup, nodeId: string): ConditionGroup | null {
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    if (child.type === "group") {
      const found = findParentGroup(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function findRule(root: ConditionGroup, id: string): Rule | null {
  for (const child of root.children) {
    if (child.id === id && child.type === "rule") return child;
    if (child.type === "group") {
      const found = findRule(child, id);
      if (found) return found;
    }
  }
  return null;
}

function makeInitialRoot(): ConditionGroup {
  return { id: "root", type: "group", logic: "AND", collapsed: false, children: [] };
}

function makeRule(field: string, operator: Operator, value: RuleValue): Rule {
  return { id: nanoid(), type: "rule", field, operator, value };
}

function makeGroup(): ConditionGroup {
  return { id: nanoid(), type: "group", logic: "AND", collapsed: false, children: [] };
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface QueryStoreState {
  root: ConditionGroup;

  // Mutations
  addRule: (parentId: string, field?: string, operator?: Operator) => void;
  addGroup: (parentId: string) => void;
  removeNode: (id: string) => void;
  updateRule: (id: string, patch: Partial<Pick<Rule, "field" | "operator" | "value">>) => void;
  toggleGroupLogic: (id: string) => void;
  toggleCollapse: (id: string) => void;
  reorderChildren: (parentId: string, fromIndex: number, toIndex: number) => void;
  resetQuery: () => void;
  loadQuery: (root: ConditionGroup) => void;

  // Utility selectors (non-reactive, call in actions)
  getRoot: () => ConditionGroup;
}

export const useQueryStore = create<QueryStoreState>()(
  immer((set, get) => ({
    root: makeInitialRoot(),

    getRoot: () => get().root,

    addRule: (parentId, field = "", operator = "equals") =>
      set((state) => {
        const group = findGroup(state.root, parentId);
        if (group) group.children.push(makeRule(field, operator, ""));
      }),

    addGroup: (parentId) =>
      set((state) => {
        const group = findGroup(state.root, parentId);
        if (group) group.children.push(makeGroup());
      }),

    removeNode: (id) =>
      set((state) => {
        const parent = findParentGroup(state.root, id);
        if (parent) {
          parent.children = parent.children.filter((c) => c.id !== id);
        }
      }),

    updateRule: (id, patch) =>
      set((state) => {
        const rule = findRule(state.root, id);
        if (!rule) return;
        if (patch.field !== undefined) {
          rule.field = patch.field;
          // Reset operator and value when field changes
          rule.operator = "equals";
          rule.value = "";
        }
        if (patch.operator !== undefined) {
          rule.operator = patch.operator;
          // Reset value when operator changes to nullcheck
          if (patch.operator === "is_null" || patch.operator === "is_not_null") {
            rule.value = null;
          }
        }
        if (patch.value !== undefined) rule.value = patch.value;
      }),

    toggleGroupLogic: (id) =>
      set((state) => {
        const group = findGroup(state.root, id);
        if (group) group.logic = group.logic === "AND" ? "OR" : "AND";
      }),

    toggleCollapse: (id) =>
      set((state) => {
        const group = findGroup(state.root, id);
        if (group) group.collapsed = !group.collapsed;
      }),

    reorderChildren: (parentId, fromIndex, toIndex) =>
      set((state) => {
        const group = findGroup(state.root, parentId);
        if (!group) return;
        const children = group.children;
        if (fromIndex < 0 || fromIndex >= children.length) return;
        if (toIndex < 0 || toIndex >= children.length) return;
        const [moved] = children.splice(fromIndex, 1);
        children.splice(toIndex, 0, moved);
      }),

    resetQuery: () => set((state) => { state.root = makeInitialRoot(); }),

    loadQuery: (root) => set((state) => { state.root = root; }),
  }))
);
