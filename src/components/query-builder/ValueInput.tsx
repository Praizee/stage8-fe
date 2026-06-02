"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NO_VALUE_OPERATORS, RANGE_OPERATORS, LIST_OPERATORS } from "@/lib/query-engine/types";
import type { Operator, RuleValue, SchemaField } from "@/lib/query-engine/types";

interface ValueInputProps {
  operator: Operator;
  field: SchemaField | undefined;
  value: RuleValue;
  onChange: (v: RuleValue) => void;
  hasError?: boolean;
}

const cls = (hasError?: boolean) =>
  `h-8 text-xs ${hasError ? "border-destructive ring-1 ring-destructive" : ""}`;

export const ValueInput = React.memo(function ValueInput({ operator, field, value, onChange, hasError }: ValueInputProps) {
  if (!field) return null;
  if (NO_VALUE_OPERATORS.includes(operator)) return null;

  // BETWEEN — two inputs
  if (RANGE_OPERATORS.includes(operator)) {
    const arr = Array.isArray(value) ? value : ["", ""];
    const inputType = field.type === "date" ? "date" : "number";
    return (
      <div className="flex items-center gap-1">
        <Input
          type={inputType}
          className={`${cls(hasError)} w-[110px]`}
          value={String(arr[0] ?? "")}
          placeholder="min"
          onChange={(e) => onChange([e.target.value, arr[1] ?? ""])}
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type={inputType}
          className={`${cls(hasError)} w-[110px]`}
          value={String(arr[1] ?? "")}
          placeholder="max"
          onChange={(e) => onChange([arr[0] ?? "", e.target.value])}
        />
      </div>
    );
  }

  // IN / NOT IN — comma-separated
  if (LIST_OPERATORS.includes(operator)) {
    const display = Array.isArray(value) ? (value as (string | number)[]).join(", ") : String(value ?? "");
    return (
      <Input
        className={`${cls(hasError)} min-w-[180px]`}
        placeholder="val1, val2, …"
        value={display}
        onChange={(e) =>
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
        }
      />
    );
  }

  const scalar = Array.isArray(value) ? "" : value;

  // BOOLEAN
  if (field.type === "boolean") {
    return (
      <Select
        value={scalar === true ? "true" : scalar === false ? "false" : ""}
        onValueChange={(v) => onChange(v === "true")}
      >
        <SelectTrigger className={`h-8 w-[100px] text-xs ${hasError ? "border-destructive ring-1 ring-destructive" : ""}`}>
          <SelectValue placeholder="Value…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true" className="text-xs">true</SelectItem>
          <SelectItem value="false" className="text-xs">false</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // ENUM
  if (field.type === "enum" && field.enumOptions) {
    return (
      <Select value={String(scalar ?? "")} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className={`h-8 min-w-[130px] text-xs ${hasError ? "border-destructive ring-1 ring-destructive" : ""}`}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {field.enumOptions.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // DATE
  if (field.type === "date") {
    return (
      <Input
        type="date"
        className={`${cls(hasError)} w-[150px]`}
        value={String(scalar ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // NUMBER
  if (field.type === "number") {
    return (
      <Input
        type="number"
        className={`${cls(hasError)} w-[110px]`}
        placeholder="0"
        value={scalar === null || scalar === undefined ? "" : String(scalar)}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  }

  // STRING (default)
  return (
    <Input
      type="text"
      className={`${cls(hasError)} min-w-[150px]`}
      placeholder="Enter value…"
      value={String(scalar ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
});
