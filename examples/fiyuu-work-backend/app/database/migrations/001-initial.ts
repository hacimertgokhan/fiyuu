import { db } from "@fiyuu/db";

export async function up() {
  // Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  
  // Workspaces table (multi-tenant)
  await db.query(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      ownerId TEXT NOT NULL,
      plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'enterprise')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (ownerId) REFERENCES users(id)
    )
  `);
  
  // Workspace members (many-to-many)
  await db.query(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member', 'viewer')),
      joinedAt TEXT NOT NULL,
      UNIQUE(workspaceId, userId),
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Projects table
  await db.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      workspaceId TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);
  
  // Tasks table
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'review', 'done')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      projectId TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      assigneeId TEXT,
      createdBy TEXT NOT NULL,
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (assigneeId) REFERENCES users(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);
  
  // Comments table
  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      taskId TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `);
  
  // Notifications table
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('task_assigned', 'task_completed', 'comment_added', 'mention')),
      title TEXT NOT NULL,
      message TEXT,
      userId TEXT NOT NULL,
      workspaceId TEXT,
      taskId TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  
  // Activity log table
  await db.query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  
  // File uploads table
  await db.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      uploadedBy TEXT NOT NULL,
      workspaceId TEXT,
      taskId TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (uploadedBy) REFERENCES users(id),
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes for performance
  await db.table("users").createIndex("email", { unique: true });
  await db.table("workspaces").createIndex("slug", { unique: true });
  await db.table("workspaces").createIndex("ownerId");
  await db.table("workspace_members").createIndex(["workspaceId", "userId"], { unique: true });
  await db.table("projects").createIndex("workspaceId");
  await db.table("tasks").createIndex("workspaceId");
  await db.table("tasks").createIndex("projectId");
  await db.table("tasks").createIndex("assigneeId");
  await db.table("comments").createIndex("taskId");
  await db.table("notifications").createIndex("userId");
  await db.table("activity_log").createIndex("workspaceId");
  
  console.log("✅ Database migration completed");
}

export async function down() {
  // Drop in reverse order
  await db.query("DROP TABLE IF EXISTS uploads");
  await db.query("DROP TABLE IF EXISTS activity_log");
  await db.query("DROP TABLE IF EXISTS notifications");
  await db.query("DROP TABLE IF EXISTS comments");
  await db.query("DROP TABLE IF EXISTS tasks");
  await db.query("DROP TABLE IF EXISTS projects");
  await db.query("DROP TABLE IF EXISTS workspace_members");
  await db.query("DROP TABLE IF EXISTS workspaces");
  await db.query("DROP TABLE IF EXISTS users");
}
