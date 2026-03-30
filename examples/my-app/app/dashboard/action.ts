import { z } from "zod";
import { defineAction, type ActionContext } from "@fiyuu/core/client";
import { readDb, writeDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";

export const action = defineAction({
  description: "Create, toggle publish state, or delete a doc. Also create/delete changelog entries.",
  input: z.object({
    kind: z.enum(["create-doc", "toggle-doc", "delete-doc", "create-changelog", "delete-changelog"]),
    // doc fields
    id: z.string().optional(),
    slug: z.string().optional(),
    title: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    category: z.enum(["getting-started", "core-concepts", "reference"]).optional(),
    // changelog fields
    version: z.string().optional(),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    id: z.string().optional(),
  }),
});

export async function execute({ input, request }: ActionContext<typeof action>) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "admin") {
    return { success: false, message: "Unauthorized." };
  }

  const db = await readDb();

  // ── Create doc ────────────────────────────────────────────────────────────
  if (input.kind === "create-doc") {
    const { slug, title, excerpt, content, category } = input;
    if (!slug || !title || !excerpt || !content || !category) {
      return { success: false, message: "All fields are required." };
    }
    if (db.docs.some((d) => d.slug === slug)) {
      return { success: false, message: `Slug "${slug}" already exists.` };
    }
    const maxOrder = db.docs.filter((d) => d.category === category).reduce((m, d) => Math.max(m, d.order), 0);
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.docs.push({
      id,
      slug,
      title,
      excerpt,
      content,
      category,
      order: maxOrder + 1,
      published: false,
      authorId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await writeDb(db);
    return { success: true, message: "Doc created as draft.", id };
  }

  // ── Toggle doc publish ────────────────────────────────────────────────────
  if (input.kind === "toggle-doc") {
    const doc = db.docs.find((d) => d.id === input.id);
    if (!doc) return { success: false, message: "Doc not found." };
    doc.published = !doc.published;
    doc.updatedAt = Date.now();
    await writeDb(db);
    return { success: true, message: doc.published ? "Doc published." : "Doc moved to drafts." };
  }

  // ── Delete doc ────────────────────────────────────────────────────────────
  if (input.kind === "delete-doc") {
    const idx = db.docs.findIndex((d) => d.id === input.id);
    if (idx === -1) return { success: false, message: "Doc not found." };
    db.docs.splice(idx, 1);
    await writeDb(db);
    return { success: true, message: "Doc deleted." };
  }

  // ── Create changelog entry ────────────────────────────────────────────────
  if (input.kind === "create-changelog") {
    const { version, title, content } = input;
    if (!version || !title || !content) {
      return { success: false, message: "Version, title, and content are required." };
    }
    if (db.changelog.some((c) => c.version === version)) {
      return { success: false, message: `Version ${version} already exists.` };
    }
    const id = `cl_${Date.now()}`;
    db.changelog.push({ id, version, title, content, createdAt: Date.now() });
    await writeDb(db);
    return { success: true, message: `Changelog v${version} created.`, id };
  }

  // ── Delete changelog entry ────────────────────────────────────────────────
  if (input.kind === "delete-changelog") {
    const idx = db.changelog.findIndex((c) => c.id === input.id);
    if (idx === -1) return { success: false, message: "Entry not found." };
    db.changelog.splice(idx, 1);
    await writeDb(db);
    return { success: true, message: "Changelog entry deleted." };
  }

  return { success: false, message: "Unknown action kind." };
}
