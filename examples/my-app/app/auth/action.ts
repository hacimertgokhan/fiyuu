import { z } from "zod";
import { defineAction, type ActionContext } from "@fiyuu/core/client";
import { readDb, writeDb } from "../../lib/db.js";
import { hashPassword, createSession, expireSession } from "../../lib/auth.js";

export const action = defineAction({
  description: "Handle login, register, and logout actions.",
  input: z.object({
    kind: z.enum(["login", "register", "logout"]),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(2).optional(),
    sessionId: z.string().optional(),
  }),
  output: z.object({
    success: z.boolean(),
    sessionId: z.string().optional(),
    message: z.string().optional(),
  }),
});

export async function execute({ input }: ActionContext<typeof action>) {
  // ── Logout ────────────────────────────────────────────────────────────────
  if (input.kind === "logout") {
    if (input.sessionId) {
      await expireSession(input.sessionId);
    }
    return { success: true };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (input.kind === "login") {
    const { email, password } = input;
    if (!email || !password) {
      return { success: false, message: "Email and password are required." };
    }

    const db = await readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    if (user.passwordHash !== hashPassword(password)) {
      return { success: false, message: "Invalid email or password." };
    }

    const sessionId = await createSession(user.id);
    return { success: true, sessionId };
  }

  // ── Register ──────────────────────────────────────────────────────────────
  if (input.kind === "register") {
    const { email, password, name } = input;
    if (!email || !password || !name) {
      return { success: false, message: "Name, email, and password are required." };
    }

    const db = await readDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.users.push({
      id: userId,
      name,
      email: email.toLowerCase(),
      role: "user",
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
    });
    await writeDb(db);

    const sessionId = await createSession(userId);
    return { success: true, sessionId };
  }

  return { success: false, message: "Unknown action." };
}
