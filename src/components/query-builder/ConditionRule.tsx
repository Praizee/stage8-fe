"use client";
import React, { useCallback } from "react";
import { GripVertical, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldSelector } from "./FieldSelector";
import { OperatorSelector } from "./OperatorSelector";
import { ValueInput } from "./ValueInput";
import { useQueryBuilderCtx } from "./query-builder-context";
import { useQueryStore } from "@/store/query-store";
import type { Rule } from "@/lib/query-engine/types";

interface ConditionRuleProps {
  rule: Rule;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export const ConditionRule = React.memo(function ConditionRule({
  rule,
  dragHandleProps,
  isDragging,
}: ConditionRuleProps) {
  const { schema, errorNodeIds } = useQueryBuilderCtx();
  const { updateRule, removeNode } = useQueryStore();
  const hasError = errorNodeIds.has(rule.id);

  const field = schema.fields.find((f) => f.key === rule.field);

  const handleFieldChange = useCallback(
    (fieldKey: string) => updateRule(rule.id, { field: fieldKey }),
    [rule.id, updateRule]
  );
  const handleOperatorChange = useCallback(
    (op: Parameters<typeof updateRule>[1]["operator"]) => updateRule(rule.id, { operator: op }),
    [rule.id, updateRule]
  );
  const handleValueChange = useCallback(
    (val: Parameters<typeof updateRule>[1]["value"]) => updateRule(rule.id, { value: val }),
    [rule.id, updateRule]
  );
  const handleRemove = useCallback(() => removeNode(rule.id), [rule.id, removeNode]);

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 animate-in-up ${
        isDragging
          ? "border-primary/50 bg-primary/5 shadow-lg"
          : hasError
          ? "border-destructive/50 bg-destructive/5"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/20"
      }`}
    >
      {/* Drag handle */}
      <button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none flex-shrink-0"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Field */}
      <FieldSelector value={rule.field} onChange={handleFieldChange} hasError={hasError && !rule.field} />

      {/* Operator — only show when field is selected */}
      {field && (
        <OperatorSelector
          value={rule.operator}
          fieldType={field.type}
          onChange={handleOperatorChange}
        />
      )}

      {/* Value */}
      {field && (
        <ValueInput
          operator={rule.operator}
          field={field}
          value={rule.value}
          onChange={handleValueChange}
          hasError={hasError}
        />
      )}

      <div className="flex-1" />

      {/* Error indicator */}
      {hasError && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Invalid condition</TooltipContent>
        </Tooltip>
      )}

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
        onClick={handleRemove}
        aria-label="Remove condition"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});
