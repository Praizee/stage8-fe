"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { ConditionGroup, QueryHistoryEntry, QueryPreset } from "@/lib/query-engine/types";

const MAX_HISTORY = 20;

interface UIStoreState {
  // Panel
  activePreviewTab: "sql" | "mongodb" | "graphql";
  setActivePreviewTab: (tab: "sql" | "mongodb" | "graphql") => void;

  // History
  history: QueryHistoryEntry[];
  addHistory: (entry: Omit<QueryHistoryEntry, "id" | "executedAt">) => void;
  clearHistory: () => void;

  // Presets
  presets: QueryPreset[];
  savePreset: (name: string, tree: ConditionGroup, schemaId: string) => QueryPreset;
  deletePreset: (id: string) => void;
  updatePresetName: (id: string, name: string) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      activePreviewTab: "sql",
      setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),

      history: [],
      addHistory: (entry) =>
        set((state) => ({
          history: [
            { ...entry, id: nanoid(), executedAt: new Date().toISOString() },
            ...state.history,
          ].slice(0, MAX_HISTORY),
        })),
      clearHistory: () => set({ history: [] }),

      presets: [],
      savePreset: (name, tree, schemaId) => {
        const preset: QueryPreset = {
          id: nanoid(),
          name,
          createdAt: new Date().toISOString(),
          tree,
          schemaId,
        };
        set((state) => ({ presets: [preset, ...state.presets] }));
        return preset;
      },
      deletePreset: (id) =>
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) })),
      updatePresetName: (id, name) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
    }),
    {
      name: "querycraft-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state: UIStoreState) => ({
        history: state.history,
        presets: state.presets,
        activePreviewTab: state.activePreviewTab,
      }),
    }
  )
);
