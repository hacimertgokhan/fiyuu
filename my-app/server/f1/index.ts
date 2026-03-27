import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type UserRole = "admin" | "member";
type SessionStatus = "active" | "signed_out";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: number;
};

type SessionRecord = {
  id: string;
  userId: string;
  status: SessionStatus;
  createdAt: number;
};

type PostRecord = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
};

type F1DatabaseShape = {
  users: UserRecord[];
  sessions: SessionRecord[];
  posts: PostRecord[];
};

export type SafeUser = Omit<UserRecord, "passwordHash">;

export type PostView = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  author: {
    id: string;
    name: string;
    email: string;
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

const databasePath = path.resolve(process.cwd(), ".fiyuu", "data", "f1.json");
let writeQueue = Promise.resolve();

class F1Table<TRecord extends { id: string }> {
  constructor(private readonly tableName: keyof F1DatabaseShape) {}

  async findMany(): Promise<TRecord[]> {
    const database = await loadDatabase();
    return structuredClone(database[this.tableName]) as unknown as TRecord[];
  }

  async findFirst(predicate: (record: TRecord) => boolean): Promise<TRecord | null> {
    const rows = await this.findMany();
    return rows.find(predicate) ?? null;
  }

  async insert(record: TRecord): Promise<TRecord> {
    await mutateDatabase((database) => {
      database[this.tableName].unshift(record as never);
    });
    return record;
  }

  async replace(records: TRecord[]): Promise<void> {
    await mutateDatabase((database) => {
      database[this.tableName] = records as never;
    });
  }
}

function createF1Database() {
  return {
    table<TRecord extends { id: string }>(tableName: keyof F1DatabaseShape) {
      return new F1Table<TRecord>(tableName);
    },
  };
}

const f1 = createF1Database();

async function ensureDatabase(): Promise<void> {
  if (existsSync(databasePath)) {
    return;
  }
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, `${JSON.stringify(createSeedDatabase(), null, 2)}\n`);
}

async function loadDatabase(): Promise<F1DatabaseShape> {
  await ensureDatabase();
  const content = await readFile(databasePath, "utf8");
  return JSON.parse(content) as F1DatabaseShape;
}

async function mutateDatabase(mutator: (database: F1DatabaseShape) => void): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const database = await loadDatabase();
    mutator(database);
    await mkdir(path.dirname(databasePath), { recursive: true });
    await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`);
  });
  await writeQueue;
}

function createSeedDatabase(): F1DatabaseShape {
  const adminId = "usr_admin_001";
  const now = Date.now();
  return {
    users: [
      {
        id: adminId,
        name: "Admin",
        email: "admin@fiyuu.dev",
        role: "admin",
        passwordHash: hashPassword("admin123"),
        createdAt: now,
      },
    ],
    sessions: [],
    posts: [
      {
        id: "pst_001",
        title: "Welcome to Fiyuu Blog",
        excerpt: "A simple Gea-first blog starter running on F1.",
        content: "This project keeps app routes simple, uses modal auth, and stores blog data in F1.",
        authorId: adminId,
        published: true,
        createdAt: now - 120000,
        updatedAt: now - 120000,
      },
      {
        id: "pst_002",
        title: "Admin area is ready",
        excerpt: "Use the admin page to inspect users, sessions, and posts.",
        content: "Admin tools now read directly from F1 and let you manage post publishing quickly.",
        authorId: adminId,
        published: true,
        createdAt: now - 60000,
        updatedAt: now - 60000,
      },
    ],
  };
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function hashPassword(password: string): string {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `f1_${(hash >>> 0).toString(16)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeText(value: string, fallback: string): string {
  const clean = value.trim();
  return clean.length ? clean : fallback;
}

function toSafeUser(user: UserRecord): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function requireActiveSession(sessionId: string): Promise<{ session: SessionRecord; user: UserRecord }> {
  const sessions = await f1.table<SessionRecord>("sessions").findMany();
  const session = sessions.find((entry) => entry.id === sessionId && entry.status === "active");
  if (!session) {
    throw new Error("Session not found");
  }
  const users = await f1.table<UserRecord>("users").findMany();
  const user = users.find((entry) => entry.id === session.userId);
  if (!user) {
    throw new Error("User not found");
  }
  return { session, user };
}

function toPostView(post: PostRecord, author: UserRecord, viewer: UserRecord | null): PostView {
  const canManage = !!viewer && (viewer.role === "admin" || viewer.id === post.authorId);
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: author.id,
      name: author.name,
      email: author.email,
    },
    permissions: {
      canEdit: canManage,
      canDelete: canManage,
    },
  };
}

async function getViewerBySessionId(sessionId?: string): Promise<UserRecord | null> {
  if (!sessionId) {
    return null;
  }
  try {
    const active = await requireActiveSession(sessionId);
    return active.user;
  } catch {
    return null;
  }
}

export async function signUp(name: string, email: string, password: string) {
  const usersTable = f1.table<UserRecord>("users");
  const sessionsTable = f1.table<SessionRecord>("sessions");
  const users = await usersTable.findMany();
  const normalizedEmail = normalizeEmail(email);
  const exists = users.some((entry) => normalizeEmail(entry.email) === normalizedEmail);
  if (exists) {
    return { success: false, message: "Email is already in use", session: null, user: null };
  }

  const user: UserRecord = {
    id: generateId("usr"),
    name: sanitizeText(name, "New User"),
    email: normalizedEmail,
    role: "member",
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };
  await usersTable.insert(user);

  const session: SessionRecord = {
    id: generateId("ses"),
    userId: user.id,
    status: "active",
    createdAt: Date.now(),
  };
  await sessionsTable.insert(session);

  return { success: true, message: "Account created", session, user: toSafeUser(user) };
}

export async function signIn(email: string, password: string) {
  const usersTable = f1.table<UserRecord>("users");
  const sessionsTable = f1.table<SessionRecord>("sessions");
  const normalizedEmail = normalizeEmail(email);
  const user = await usersTable.findFirst((entry) => normalizeEmail(entry.email) === normalizedEmail);
  if (!user) {
    return { success: false, message: "Unknown email", session: null, user: null };
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, message: "Invalid password", session: null, user: null };
  }

  const session: SessionRecord = {
    id: generateId("ses"),
    userId: user.id,
    status: "active",
    createdAt: Date.now(),
  };
  await sessionsTable.insert(session);
  return { success: true, message: "Signed in", session, user: toSafeUser(user) };
}

export async function signOut(sessionId: string) {
  const sessionsTable = f1.table<SessionRecord>("sessions");
  const sessions = await sessionsTable.findMany();
  const nextSessions = sessions.map((entry) =>
    entry.id === sessionId
      ? {
          ...entry,
          status: "signed_out" as const,
        }
      : entry,
  );
  await sessionsTable.replace(nextSessions);
  return { success: true };
}

export async function getSessionProfile(sessionId: string): Promise<{ session: SessionRecord; user: SafeUser } | null> {
  try {
    const active = await requireActiveSession(sessionId);
    return {
      session: active.session,
      user: toSafeUser(active.user),
    };
  } catch {
    return null;
  }
}

export async function listPostsForViewer(sessionId?: string): Promise<PostView[]> {
  const posts = await f1.table<PostRecord>("posts").findMany();
  const users = await f1.table<UserRecord>("users").findMany();
  const viewer = await getViewerBySessionId(sessionId);

  const visiblePosts = posts.filter((post) => {
    if (post.published) {
      return true;
    }
    if (!viewer) {
      return false;
    }
    return viewer.role === "admin" || viewer.id === post.authorId;
  });

  return visiblePosts
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((post) => {
      const author = users.find((entry) => entry.id === post.authorId);
      if (!author) {
        throw new Error(`Author missing for post ${post.id}`);
      }
      return toPostView(post, author, viewer);
    });
}

export async function listRecentPublishedPosts(limit: number): Promise<PostView[]> {
  const all = await listPostsForViewer();
  return all.filter((post) => post.published).slice(0, limit);
}

export async function createPost(input: {
  sessionId: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
}) {
  const active = await requireActiveSession(input.sessionId);
  const postsTable = f1.table<PostRecord>("posts");
  const now = Date.now();
  const post: PostRecord = {
    id: generateId("pst"),
    title: sanitizeText(input.title, "Untitled post"),
    excerpt: sanitizeText(input.excerpt, "No excerpt"),
    content: sanitizeText(input.content, "No content"),
    authorId: active.user.id,
    published: input.published,
    createdAt: now,
    updatedAt: now,
  };
  await postsTable.insert(post);
  return post;
}

export async function updatePost(input: {
  sessionId: string;
  postId: string;
  title?: string;
  excerpt?: string;
  content?: string;
  published?: boolean;
}) {
  const active = await requireActiveSession(input.sessionId);
  const postsTable = f1.table<PostRecord>("posts");
  const posts = await postsTable.findMany();
  const current = posts.find((entry) => entry.id === input.postId);
  if (!current) {
    throw new Error("Post not found");
  }
  const canManage = active.user.role === "admin" || active.user.id === current.authorId;
  if (!canManage) {
    throw new Error("Forbidden");
  }

  const updated: PostRecord = {
    ...current,
    title: input.title === undefined ? current.title : sanitizeText(input.title, current.title),
    excerpt: input.excerpt === undefined ? current.excerpt : sanitizeText(input.excerpt, current.excerpt),
    content: input.content === undefined ? current.content : sanitizeText(input.content, current.content),
    published: input.published === undefined ? current.published : input.published,
    updatedAt: Date.now(),
  };

  await postsTable.replace(posts.map((entry) => (entry.id === current.id ? updated : entry)));
  return updated;
}

export async function deletePost(sessionId: string, postId: string) {
  const active = await requireActiveSession(sessionId);
  const postsTable = f1.table<PostRecord>("posts");
  const posts = await postsTable.findMany();
  const current = posts.find((entry) => entry.id === postId);
  if (!current) {
    throw new Error("Post not found");
  }
  const canManage = active.user.role === "admin" || active.user.id === current.authorId;
  if (!canManage) {
    throw new Error("Forbidden");
  }
  await postsTable.replace(posts.filter((entry) => entry.id !== postId));
  return { success: true };
}

export async function listUsers(): Promise<SafeUser[]> {
  const users = await f1.table<UserRecord>("users").findMany();
  return users.map((entry) => toSafeUser(entry));
}

export async function listSessions(): Promise<SessionRecord[]> {
  return f1.table<SessionRecord>("sessions").findMany();
}

export async function getProfileOverview(sessionId: string) {
  const active = await requireActiveSession(sessionId);
  const posts = await listPostsForViewer(sessionId);
  return {
    user: toSafeUser(active.user),
    posts: posts.filter((entry) => entry.author.id === active.user.id),
  };
}

export async function getAdminOverview(sessionId: string) {
  const active = await requireActiveSession(sessionId);
  if (active.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  const users = await listUsers();
  const sessions = await listSessions();
  const posts = await listPostsForViewer(sessionId);
  return {
    viewer: toSafeUser(active.user),
    users,
    sessions,
    posts,
    totals: {
      users: users.length,
      sessions: sessions.filter((entry) => entry.status === "active").length,
      posts: posts.length,
      drafts: posts.filter((entry) => !entry.published).length,
    },
  };
}
