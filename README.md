# QueryCraft: Visual Query Builder

QueryCraft is a production-grade visual query builder constructed using **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS (v4)**, and **Zustand**. It supports infinite logical grouping, schema validation, live SQL/MongoDB/GraphQL queries generation, and a real-time dataset execution simulator.

## Key Features

- **Schema-Driven Fields & Operators:** Supports 18 operators matching field types (strings, numbers, booleans, dates, and enums).
- **Infinite Group Nesting:** Build complex nested conditions with direct visual indicators, logical connectors (AND/OR), and collapsible sections.
- **Tri-Format Code Preview:** Real-time generation of clean **SQL**, **MongoDB Query Documents**, and **GraphQL Filters** with custom regex syntax highlighting.
- **Execution Simulator:** Filters deterministic mock records with real-time feedback, sortable results, and 25-item page pagination.
- **JSON Import/Export:** Versioned query configuration serializer with structural integrity checks.
- **Query History & Presets:** Persisted locally via `localStorage` with automated schema switching on restore.
- **Keyboard Shortcuts:**
  - `Ctrl + Enter` / `Cmd + Enter`: Run Query
  - `Ctrl + S` / `Cmd + S`: Save Preset Dialog
  - `Ctrl + E` / `Cmd + E`: Export Query
  - `Ctrl + I` / `Cmd + I`: Import Query Dialog

---

## Architecture & Core Strategy

### 1. Recursive Data Strategy

Queries are structured as a tree of `QueryNode` items (which can be either a `Rule` leaf or a `ConditionGroup` branch). The state is managed as a single root `ConditionGroup`.
Recursive helper functions traverse this tree to:

- Generate SQL, MongoDB, and GraphQL outputs (`src/lib/query-engine/builder.ts`).
- Perform type and operator validation (`src/lib/query-engine/validator.ts`).
- Filter mock datasets against standard records (`src/lib/query-engine/executor.ts`).

### 2. State Management with Zustand & Immer

To support infinite nesting, Zustand handles deep structural mutations immutably using Immer. Deep traversals search and mutate specific node IDs via recursion (finding parents/siblings/rules in place).

### 3. Drag & Drop Reordering

Using `@dnd-kit/core` and `@dnd-kit/sortable`, rules and nested groups can be dragged and reordered directly within their parent logical groups.

---

## Project Setup

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

### Running Tests

Vitest tests cover the query builder engine, validator, dataset executor, JSON serializer, and condition group components.

```bash
pnpm test          # Run all 82 test cases
pnpm test:watch    # Watch mode
pnpm test:coverage # Code coverage report
```

