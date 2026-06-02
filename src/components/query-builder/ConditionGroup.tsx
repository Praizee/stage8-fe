"use client";
import React, { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FolderPlus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraggableItem } from "./DraggableItem";
import { ConditionRule } from "./ConditionRule";
import { useQueryStore } from "@/store/query-store";
import type { ConditionGroup as ConditionGroupType } from "@/lib/query-engine/types";

const DEPTH_BARS = ["", "depth-bar-1", "depth-bar-2", "depth-bar-3", "depth-bar-4"];

interface ConditionGroupProps {
  group: ConditionGroupType;
  depth: number;
  isRoot?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export const ConditionGroup = React.memo(function ConditionGroup({
  group,
  depth,
  isRoot = false,
  dragHandleProps,
}: ConditionGroupProps) {
  const { addRule, addGroup, removeNode, toggleGroupLogic, toggleCollapse, reorderChildren } =
    useQueryStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const children = group.children;
      const from = children.findIndex((c) => c.id === active.id);
      const to = children.findIndex((c) => c.id === over.id);
      if (from !== -1 && to !== -1) reorderChildren(group.id, from, to);
    },
    [group.children, group.id, reorderChildren]
  );

  const handleAddRule = useCallback(() => addRule(group.id), [group.id, addRule]);
  const handleAddGroup = useCallback(() => addGroup(group.id), [group.id, addGroup]);
  const handleToggleLogic = useCallback(() => toggleGroupLogic(group.id), [group.id, toggleGroupLogic]);
  const handleToggleCollapse = useCallback(() => toggleCollapse(group.id), [group.id, toggleCollapse]);
  const handleRemove = useCallback(() => removeNode(group.id), [group.id, removeNode]);

  const depthBar = DEPTH_BARS[Math.min(depth, 4)] ?? "depth-bar-4";
  const childIds = group.children.map((c) => c.id);

  return (
    <div
      className={`rounded-xl border border-border bg-card/60 backdrop-blur-sm transition-all duration-200 animate-in-up ${
        depth > 0 ? `${depthBar} ml-4 pl-3` : ""
      }`}
    >
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        {/* Drag handle for nested groups */}
        {!isRoot && dragHandleProps && (
          <button
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
            tabIndex={-1}
            aria-label="Drag group"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={handleToggleCollapse}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={group.collapsed ? "Expand group" : "Collapse group"}
        >
          {group.collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Logic toggle */}
        <button
          onClick={handleToggleLogic}
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={`Logic: ${group.logic}. Click to toggle.`}
        >
          <Badge
            variant={group.logic === "AND" ? "default" : "secondary"}
            className={`text-xs font-bold px-2 cursor-pointer select-none transition-colors ${
              group.logic === "AND"
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
            }`}
          >
            {group.logic}
          </Badge>
        </button>

        {group.collapsed && group.children.length > 0 && (
          <span className="text-muted-foreground text-xs">
            {group.children.length} condition{group.children.length !== 1 ? "s" : ""}
          </span>
        )}

        <div className="flex-1" />

        {/* Add buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleAddRule}
        >
          <Plus className="h-3 w-3" />
          Rule
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleAddGroup}
        >
          <FolderPlus className="h-3 w-3" />
          Group
        </Button>

        {/* Remove group (not root) */}
        {!isRoot && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            aria-label="Remove group"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Children */}
      {!group.collapsed && (
        <div className="p-3 space-y-2">
          {group.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <p className="text-muted-foreground text-sm">No conditions yet.</p>
              <p className="text-muted-foreground/60 text-xs">
                Click <strong>Rule</strong> to add a condition or <strong>Group</strong> to nest logic.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {group.children.map((child, idx) => (
                  <React.Fragment key={child.id}>
                    {/* Logic separator between siblings */}
                    {idx > 0 && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-border/60" />
                        <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          group.logic === "AND"
                            ? "text-primary bg-primary/10"
                            : "text-violet-400 bg-violet-500/10"
                        }`}>
                          {group.logic}
                        </span>
                        <div className="flex-1 h-px bg-border/60" />
                      </div>
                    )}

                    <DraggableItem id={child.id}>
                      {({ dragHandleProps: dhp, isDragging }) =>
                        child.type === "rule" ? (
                          <ConditionRule
                            rule={child}
                            dragHandleProps={dhp}
                            isDragging={isDragging}
                          />
                        ) : (
                          <ConditionGroup
                            group={child}
                            depth={depth + 1}
                            dragHandleProps={dhp}
                          />
                        )
                      }
                    </DraggableItem>
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
});
