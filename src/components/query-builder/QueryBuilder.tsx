"use client";
import React, { useMemo } from "react";
import { useQueryStore } from "@/store/query-store";
import { useSchemaStore } from "@/store/schema-store";
import { validateQuery, getErrorNodeIds } from "@/lib/query-engine/validator";
import { QueryBuilderContext } from "./query-builder-context";
import { ConditionGroup } from "./ConditionGroup";

export function QueryBuilder() {
  const root = useQueryStore((s) => s.root);
  const activeSchema = useSchemaStore((s) => s.activeSchema);

  const errorNodeIds = useMemo(() => {
    const errors = validateQuery(root, activeSchema);
    return getErrorNodeIds(errors);
  }, [root, activeSchema]);

  const ctxValue = useMemo(
    () => ({ errorNodeIds, schema: activeSchema }),
    [errorNodeIds, activeSchema]
  );

  return (
    <QueryBuilderContext.Provider value={ctxValue}>
      <div className="space-y-3">
        <ConditionGroup group={root} depth={0} isRoot />
      </div>
    </QueryBuilderContext.Provider>
  );
}
