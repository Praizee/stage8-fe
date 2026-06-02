import { create } from "zustand";
import { ALL_SCHEMAS } from "@/lib/schemas";
import type { Schema } from "@/lib/query-engine/types";

interface SchemaStoreState {
  schemas: Schema[];
  activeSchema: Schema;
  setActiveSchema: (id: string) => void;
}

export const useSchemaStore = create<SchemaStoreState>()((set) => ({
  schemas: ALL_SCHEMAS,
  activeSchema: ALL_SCHEMAS[0],

  setActiveSchema: (id) =>
    set((state) => {
      const schema = state.schemas.find((s) => s.id === id);
      if (schema) return { activeSchema: schema };
      return state;
    }),
}));
