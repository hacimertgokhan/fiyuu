/**
 * Auth helpers — session management over F1.
 * Sessions are stored as rows in f1.sessions.
 * The session ID is held in a client-readable cookie (fiyuu_session).
 */

import type { IncomingMessage } from "node:http";
import { readDb, writeDb } from "./db.js";

// ── Password hashing ──────────────────────────────────────────────────────────

/** Simple deterministic hash (demo-grade). Use bcrypt/argon2 in production. */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (Math.imul(31, hash) + password.charCodeAt(i)) | 0;
  }
  return `f1_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function getSessionId(request: unknown): string | null {
  const req = request as IncomingMessage;
  const cookie = req.headers["cookie"] ?? "";
  const match = cookie.match(/(?:^|;\s*)fiyuu_session=([^;]+)/);
  return match?.[1]?.trim() ?? null;
}

// ── Session CRUD ──────────────────────────────────────────────────────────────

export async function getSessionUser(request: unknown) {
  const sessionId = getSessionId(request);
  if (!sessionId) return null;

  const db = await readDb();
  const session = db.sessions.find((s) => s.id === sessionId && s.status === "active");
  if (!session) return null;

  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function createSession(userId: string): Promise<string> {
  const db = await readDb();
  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  db.sessions.push({ id: sessionId, userId, status: "active", createdAt: Date.now() });

  // Expire old sessions beyond the last 5 per user.
  const userSessions = db.sessions.filter((s) => s.userId === userId && s.status === "active");
  if (userSessions.length > 5) {
    const toExpire = userSessions.slice(0, userSessions.length - 5);
    for (const s of toExpire) s.status = "expired";
  }

  await writeDb(db);
  return sessionId;
}

export async function expireSession(sessionId: string): Promise<void> {
  const db = await readDb();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (session) {
    session.status = "expired";
    await writeDb(db);
  }
}
