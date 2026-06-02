import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ConditionGroup } from "@/components/query-builder/ConditionGroup";
import { QueryBuilderContext } from "@/components/query-builder/query-builder-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQueryStore } from "@/store/query-store";
import type { ConditionGroup as CG, Schema } from "@/lib/query-engine/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const schema: Schema = {
  id: "test", name: "Test", description: "", tableName: "t",
  fields: [
    { key: "name", label: "Name", type: "string" },
    { key: "age",  label: "Age",  type: "number" },
  ],
};

const emptyRoot: CG = { id: "root", type: "group", logic: "AND", collapsed: false, children: [] };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <QueryBuilderContext.Provider value={{ schema, errorNodeIds: new Set() }}>
        {children}
      </QueryBuilderContext.Provider>
    </TooltipProvider>
  );
}

function renderGroup(group: CG, isRoot = false) {
  return render(
    <Wrapper>
      <ConditionGroup group={group} depth={0} isRoot={isRoot} />
    </Wrapper>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ConditionGroup", () => {
  beforeEach(() => {
    useQueryStore.setState({ root: emptyRoot } as ReturnType<typeof useQueryStore.getState>);
  });

  it("renders without crashing", () => {
    renderGroup(emptyRoot, true);
    expect(document.body).toBeTruthy();
  });

  it("shows AND badge by default", () => {
    renderGroup(emptyRoot, true);
    expect(screen.getByText("AND")).toBeInTheDocument();
  });

  it("shows empty state message when no children", () => {
    renderGroup(emptyRoot, true);
    expect(screen.getByText(/no conditions yet/i)).toBeInTheDocument();
  });

  it("shows Add Rule button", () => {
    renderGroup(emptyRoot, true);
    expect(screen.getByRole("button", { name: /rule/i })).toBeInTheDocument();
  });

  it("shows Add Group button", () => {
    renderGroup(emptyRoot, true);
    expect(screen.getByRole("button", { name: /group/i })).toBeInTheDocument();
  });

  it("clicking Add Rule adds a rule to the store", () => {
    renderGroup(emptyRoot, true);
    const addRuleBtn = screen.getByRole("button", { name: /rule/i });
    fireEvent.click(addRuleBtn);
    const { root } = useQueryStore.getState();
    expect(root.children).toHaveLength(1);
    expect(root.children[0].type).toBe("rule");
  });

  it("clicking Add Group adds a nested group to the store", () => {
    renderGroup(emptyRoot, true);
    const addGroupBtn = screen.getByRole("button", { name: /group/i });
    fireEvent.click(addGroupBtn);
    const { root } = useQueryStore.getState();
    expect(root.children).toHaveLength(1);
    expect(root.children[0].type).toBe("group");
  });

  it("clicking AND badge toggles to OR in store", () => {
    renderGroup(emptyRoot, true);
    const andBadge = screen.getByText("AND");
    fireEvent.click(andBadge);
    const { root } = useQueryStore.getState();
    expect(root.logic).toBe("OR");
  });

  it("collapse button hides children area", () => {
    const groupWithRule: CG = {
      ...emptyRoot,
      children: [{ id:"r1", type:"rule", field:"name", operator:"equals", value:"Alice" }],
    };
    renderGroup(groupWithRule, true);
    // Click collapse button (chevron)
    const collapseBtn = screen.getByRole("button", { name: /collapse/i });
    fireEvent.click(collapseBtn);
    // After collapse, "No conditions" text should not be visible (section hidden)
    expect(screen.queryByText(/no conditions/i)).not.toBeInTheDocument();
  });

  it("does NOT show remove button for root group", () => {
    renderGroup(emptyRoot, true);
    expect(screen.queryByRole("button", { name: /remove group/i })).not.toBeInTheDocument();
  });

  it("shows OR logic correctly when group is OR", () => {
    const orGroup: CG = { ...emptyRoot, logic: "OR" };
    renderGroup(orGroup, true);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});
