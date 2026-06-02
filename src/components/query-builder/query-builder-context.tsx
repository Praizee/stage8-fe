"use client";
import { createContext, useContext } from "react";
import type { Schema } from "@/lib/query-engine/types";

interface QueryBuilderContextValue {
  errorNodeIds: Set<string>;
  schema: Schema;
}

const QueryBuilderContext = createContext<QueryBuilderContextValue>({
  errorNodeIds: new Set(),
  schema: {} as Schema,
});

export function useQueryBuilderCtx() {
  return useContext(QueryBuilderContext);
}

export { QueryBuilderContext };
