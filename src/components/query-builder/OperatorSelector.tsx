"use client";
import React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OPERATORS_BY_TYPE, OPERATOR_LABELS } from "@/lib/query-engine/types";
import type { FieldType, Operator } from "@/lib/query-engine/types";

interface OperatorSelectorProps {
  value: Operator;
  fieldType: FieldType;
  onChange: (op: Operator) => void;
}

export const OperatorSelector = React.memo(function OperatorSelector({ value, fieldType, onChange }: OperatorSelectorProps) {
  const validOps = OPERATORS_BY_TYPE[fieldType] ?? [];
  const safeValue = validOps.includes(value) ? value : validOps[0];

  return (
    <Select value={safeValue} onValueChange={(v) => onChange(v as Operator)}>
      <SelectTrigger className="h-8 min-w-[130px] text-xs font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {validOps.map((op) => (
          <SelectItem key={op} value={op} className="text-xs">
            {OPERATOR_LABELS[op]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
