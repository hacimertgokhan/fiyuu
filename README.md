# Fiyuu Architecture

## Overview

Fiyuu is an AI-first, TypeScript-based web framework designed to be deterministic, structured, and fully understandable by AI systems. Unlike traditional frameworks that optimize for developer flexibility, Fiyuu prioritizes predictability, explicitness, and machine readability.

The core principle:

> A Fiyuu project must be understandable, extendable, and modifiable by an AI without requiring implicit assumptions.

---

## Core Design Principles

### 1. Deterministic Structure

* File system defines behavior
* No hidden magic or implicit conventions
* Every feature follows the same structure

### 2. Explicit Over Implicit

* All inputs, outputs, and intents must be defined
* No inference-heavy patterns
* AI should not guess — it should read

### 3. Convention Over Configuration

* Minimal configuration
* Single correct way to implement features
* Reduced cognitive and parsing complexity

### 4. AI-First Development

* Every part of the system is designed to be parsed by AI
* Structured metadata is required, not optional

---

## Project Structure

All applications follow a strict, feature-based directory structure.

```
/app
  /feature-name
    page.tsx        # UI entry (optional)
    action.ts       # business logic (required for mutations)
    query.ts        # data fetching logic (optional)
    schema.ts       # input/output definitions (required)
    meta.ts         # metadata and intent (required)
```

### Rules

* Each directory represents a feature or route scope
* File names are fixed and cannot be changed
* Missing required files indicate incomplete features
* Co-location is mandatory

---

## Schema Layer

The schema layer is the single source of truth for:

* Validation
* Types
* API contracts
* AI understanding

All actions and queries must define:

* `input`
* `output`
* `description`

Example:

```ts
export const createUser = defineAction({
  input: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  output: z.object({
    id: z.string()
  }),
  description: "Creates a new user account"
})
```

---

## Intent System

Each feature must define a clear intent describing its purpose.

Example:

```ts
export default definePage({
  intent: "User dashboard displaying analytics and recent activity",
})
```

### Requirements

* Intent is mandatory
* Must be concise and descriptive
* Must reflect user-facing behavior

---

## Execution Layer

Fiyuu uses a minimal runtime architecture:

* HTTP handling via lightweight adapters
* Server-first rendering model
* No heavy client-side state management by default

### Request Lifecycle

1. Route is resolved via file system
2. Schema validation is executed
3. Action or query is executed
4. Response is serialized
5. UI is rendered (if applicable)

---

## AI Layer

The AI layer is responsible for making the project machine-readable and AI-operable.

### Project Graph

Fiyuu generates a structured representation of the project:

```
.fiyuu/graph.json
```

Example:

```json
{
  "routes": [],
  "actions": [],
  "queries": [],
  "schemas": [],
  "relations": []
}
```

This graph acts as:

* AI context source
* Tooling foundation
* Refactoring map

---

### AI Intent Mapping

Each feature contributes to a global understanding of the application through:

* schema definitions
* intent descriptions
* dependency mapping

---

## CLI Layer

The CLI is the central control system of Fiyuu.

### Core Commands

```
fiyuu dev
fiyuu build
fiyuu generate page <name>
fiyuu generate action <name>
fiyuu sync
fiyuu ai <prompt>
```

### Responsibilities

* Project scaffolding
* Graph generation
* Code generation
* AI integration

---

## Internal Data Flow

Fiyuu enforces a strict and predictable data flow:

```
Request → Route → Schema → Action/Query → Response → UI
```

All steps are explicit and traceable.

---

## Technology Stack (Recommended)

* Runtime: Node.js or Bun
* HTTP Layer: lightweight handler (e.g., Hono-style)
* UI: React (with minimal abstraction)
* Validation: Zod
* Build Tool: Vite

---

## Non-Goals

Fiyuu intentionally avoids:

* Complex plugin ecosystems
* Over-configurable systems
* Custom bundlers
* Heavy client-side frameworks

---

## Minimum Viable Implementation

The first version of Fiyuu should include:

* File-based routing
* Schema-driven actions
* Intent system
* Graph generation (`.fiyuu/graph.json`)
* Basic CLI

---

## Long-Term Vision

Fiyuu aims to become:

> A standard for AI-readable web applications

Where:

* AI can generate features reliably
* AI can refactor entire systems safely
* Developers define intent, not implementation details

---

## Summary

Fiyuu is not just a framework.

It is a structured system where:

* Code is predictable
* Behavior is explicit
* AI is a first-class participant in development
