"use client";
import React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQueryBuilderCtx } from "./query-builder-context";

interface FieldSelectorProps {
  value: string;
  onChange: (field: string) => void;
  hasError?: boolean;
}

export const FieldSelector = React.memo(function FieldSelector({ value, onChange, hasError }: FieldSelectorProps) {
  const { schema } = useQueryBuilderCtx();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-8 min-w-[130px] text-xs font-medium ${hasError ? "border-destructive ring-1 ring-destructive" : ""}`}>
        <SelectValue placeholder="Select field…" />
      </SelectTrigger>
      <SelectContent>
        {schema.fields.map((field) => (
          <SelectItem key={field.key} value={field.key} className="text-xs">
            <span className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-muted text-muted-foreground px-1 rounded">{field.type}</span>
              {field.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
