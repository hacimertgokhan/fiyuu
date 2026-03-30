import { z } from "zod";
import { defineAction } from "@fiyuu/core/client";

export const action = defineAction({
  input: z.object({
    action: z.enum(["subscribe", "contact"]),
    email: z.string().email().optional(),
    name: z.string().max(100).optional(),
    message: z.string().max(1000).optional(),
  }),
  output: z.object({ success: z.boolean(), message: z.string() }),
  description: "Newsletter subscription and contact form",
});

export async function execute(input: Record<string, unknown>) {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const { action: act, email, name, message } = input as {
    action: "subscribe" | "contact";
    email?: string;
    name?: string;
    message?: string;
  };

  if (act === "subscribe") {
    if (!email) return { success: false, message: "Email gerekli." };

    const existing = db.table("newsletter").findOne({ email });
    if (existing) return { success: false, message: "Bu email zaten kayıtlı." };

    db.table("newsletter").insert({
      email,
      subscribedAt: Date.now(),
      active: true,
    });

    return { success: true, message: "Bültene başarıyla abone oldunuz!" };
  }

  if (act === "contact") {
    if (!email || !message) return { success: false, message: "Email ve mesaj gerekli." };

    db.table("contacts").insert({
      name: name || "Anonymous",
      email,
      message,
      createdAt: Date.now(),
      read: false,
    });

    return { success: true, message: "Mesajınız gönderildi!" };
  }

  return { success: false, message: "Geçersiz işlem." };
}
