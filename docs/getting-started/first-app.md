# First Application

Build a complete CRUD application with Fiyuu. We'll create a task manager with all five file contracts.

## What We're Building

A simple task management app with:
- List all tasks
- Add new tasks
- Mark tasks as complete
- Delete tasks

## Step 1: Project Setup

```bash
npm create fiyuu-app@latest task-manager
cd task-manager
npm install
```

## Step 2: Create the Schema

Create `app/schema.ts`:

```typescript
import { defineQuery, defineAction, z } from "@fiyuu/core";

// Task type
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
});

// Query schema
export const query = defineQuery({
  input: z.object({
    filter: z.enum(["all", "active", "completed"]).default("all"),
  }),
  output: z.object({
    tasks: z.array(TaskSchema),
    count: z.object({
      all: z.number(),
      active: z.number(),
      completed: z.number(),
    }),
  }),
  description: "List tasks with optional filtering",
});

// Add task action
export const addAction = defineAction({
  input: z.object({
    title: z.string().min(1, "Title is required").max(100),
  }),
  output: z.object({
    success: z.boolean(),
    task: TaskSchema.optional(),
    error: z.string().optional(),
  }),
  description: "Add a new task",
});

// Toggle task action
export const toggleAction = defineAction({
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
    task: TaskSchema.optional(),
  }),
  description: "Toggle task completion status",
});

// Delete task action
export const deleteAction = defineAction({
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  description: "Delete a task",
});
```

## Step 3: Create the Query

Create `app/query.ts`:

```typescript
import { query } from "./schema.js";
import { db } from "@fiyuu/db";

export { query };

export async function execute({ input }: { input: typeof query._input }) {
  // Initialize table if not exists (in production, use migrations)
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      )
    `);
  } catch {
    // Table already exists
  }

  // Fetch all tasks
  const allTasks = await db.query("SELECT * FROM tasks ORDER BY createdAt DESC");
  
  const tasks = allTasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: Boolean(t.completed),
    createdAt: t.createdAt,
  }));

  // Apply filter
  let filteredTasks = tasks;
  if (input.filter === "active") {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (input.filter === "completed") {
    filteredTasks = tasks.filter(t => t.completed);
  }

  // Count stats
  const count = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  return { tasks: filteredTasks, count };
}
```

## Step 4: Create the Actions

Create `app/action.ts`:

```typescript
import { addAction, toggleAction, deleteAction } from "./schema.js";
import { db } from "@fiyuu/db";

export { addAction, toggleAction, deleteAction };

// Add a new task
export async function addTask({ input }: { input: typeof addAction._input }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.query(
    "INSERT INTO tasks (id, title, completed, createdAt) VALUES (?, ?, ?, ?)",
    [id, input.title, 0, createdAt]
  );

  const task = {
    id,
    title: input.title,
    completed: false,
    createdAt,
  };

  return { success: true, task };
}

// Toggle task completion
export async function toggleTask({ input }: { input: typeof toggleAction._input }) {
  const [existing] = await db.query("SELECT * FROM tasks WHERE id = ?", [input.id]);
  
  if (!existing) {
    return { success: false };
  }

  const newCompleted = existing.completed ? 0 : 1;
  await db.query("UPDATE tasks SET completed = ? WHERE id = ?", [newCompleted, input.id]);

  const task = {
    id: existing.id,
    title: existing.title,
    completed: Boolean(newCompleted),
    createdAt: existing.createdAt,
  };

  return { success: true, task };
}

// Delete a task
export async function deleteTask({ input }: { input: typeof deleteAction._input }) {
  await db.query("DELETE FROM tasks WHERE id = ?", [input.id]);
  return { success: true };
}
```

## Step 5: Create the Page

Create `app/page.tsx`:

```typescript
import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PageData = Awaited<ReturnType<typeof query.execute>>;

export const page = definePage({ intent: "Task manager - CRUD operations" });

export default class TaskManager extends Component<PageProps<PageData>> {
  template({ data }: PageProps<PageData> = this.props) {
    const { tasks, count } = data;

    const taskList = tasks.map(task => html`
      <li style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #eee;">
        <form method="POST" action="/toggle" style="display: inline;">
          <input type="hidden" name="id" value="${task.id}" />
          <button type="submit" style="cursor: pointer; background: none; border: none; font-size: 20px;">
            ${task.completed ? "✅" : "⭕"}
          </button>
        </form>
        <span style="flex: 1; text-decoration: ${task.completed ? "line-through" : "none"}; opacity: ${task.completed ? 0.6 : 1};">
          ${task.title}
        </span>
        <form method="POST" action="/delete" style="display: inline;">
          <input type="hidden" name="id" value="${task.id}" />
          <button type="submit" style="cursor: pointer; background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px;">
            Delete
          </button>
        </form>
      </li>
    `).join("");

    return html`
      <main style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif;">
        <h1 style="font-size: 32px; margin-bottom: 24px;">📝 Task Manager</h1>
        
        <!-- Stats -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px; color: #666;">
          <span>All: <strong>${count.all}</strong></span>
          <span>Active: <strong>${count.active}</strong></span>
          <span>Completed: <strong>${count.completed}</strong></span>
        </div>

        <!-- Add Task Form -->
        <form method="POST" action="/add" style="display: flex; gap: 12px; margin-bottom: 24px;">
          <input 
            type="text" 
            name="title" 
            placeholder="What needs to be done?"
            required
            maxlength="100"
            style="flex: 1; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px;"
          />
          <button 
            type="submit"
            style="padding: 12px 24px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;"
          >
            Add Task
          </button>
        </form>

        <!-- Filter Links -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <a href="/?filter=all" style="color: #007bff; text-decoration: none;">All</a>
          <a href="/?filter=active" style="color: #007bff; text-decoration: none;">Active</a>
          <a href="/?filter=completed" style="color: #007bff; text-decoration: none;">Completed</a>
        </div>

        <!-- Task List -->
        ${tasks.length === 0 
          ? html`<p style="color: #999; text-align: center; padding: 40px;">No tasks yet. Add one above!</p>`
          : html`<ul style="list-style: none; padding: 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">${raw(taskList)}</ul>`
        }
      </main>
    `;
  }
}
```

## Step 6: Create Action Routes

Create action route handlers:

**app/add/route.ts**:
```typescript
import { addTask } from "../action.js";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  
  const result = await addTask({ 
    input: { title } 
  });

  // Redirect back to home
  return new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });
}
```

**app/toggle/route.ts**:
```typescript
import { toggleTask } from "../action.js";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  
  await toggleTask({ input: { id } });

  return new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });
}
```

**app/delete/route.ts**:
```typescript
import { deleteTask } from "../action.js";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  
  await deleteTask({ input: { id } });

  return new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });
}
```

## Step 7: Add Meta Configuration

Create `app/meta.ts`:

```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  intent: "Task manager application - create, complete, and delete tasks",
  render: "ssr",
  seo: {
    title: "Task Manager - Fiyuu App",
    description: "A simple task management application built with Fiyuu",
  },
});
```

## Step 8: Run the App

```bash
npm run dev
```

Open `http://localhost:4050` and test:
1. Add a new task
2. Mark it as complete
3. Delete it
4. Try the filters

## What You Learned

- **Schema-driven development**: Define types once with Zod
- **File contracts**: Each file has a specific purpose
- **Server actions**: Handle mutations with action.ts
- **Database**: Built-in F1 Database requires zero config
- **Type safety**: Full inference from schema to page

## Next Steps

- Add [authentication](../guides/authentication.md)
- Implement [real-time updates](../guides/real-time-chat.md) with WebSocket
- Learn about [background services](../guides/background-services.md)
- Deploy your app with the [deployment guide](../guides/deployment.md)
