import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    site: z.object({
      name: z.string(),
      tagline: z.string(),
      description: z.string(),
    }),
    features: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
      color: z.string(),
    })),
    plans: z.array(z.object({
      name: z.string(),
      price: z.string(),
      period: z.string(),
      highlighted: z.boolean(),
      features: z.array(z.string()),
    })),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    testimonials: z.array(z.object({
      name: z.string(),
      role: z.string(),
      text: z.string(),
      avatar: z.string(),
    })),
    subscriberCount: z.number(),
  }),
  description: "OnePage site data query",
});

export async function execute() {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const newsletterTable = db.table("newsletter");
  const subscriberCount = newsletterTable.count;

  return {
    site: {
      name: "Fiyuu",
      tagline: "Always-Live Fullstack Framework",
      description: "Lightweight, fast, and developer-friendly. Build modern web apps with a built-in DB, realtime channels, and background services.",
    },
    features: [
      {
        icon: "database",
        title: "Built-in FiyuuDB",
        description: "SQL-like queries, in-memory speed, disk persistence. No external database server needed.",
        color: "#2563EB",
      },
      {
        icon: "zap",
        title: "Realtime Channels",
        description: "Instant notifications, live updates and broadcast messages via WebSocket and NATS.",
        color: "#16A34A",
      },
      {
        icon: "layers",
        title: "Always-Live Services",
        description: "Background tasks, scheduled jobs, and cache warming. Your app never sleeps.",
        color: "#7C3AED",
      },
      {
        icon: "smartphone",
        title: "ResponsiveWrapper",
        description: "One-line responsive container with a built-in preview. Test desktop and mobile views instantly.",
        color: "#F59E0B",
      },
      {
        icon: "shield",
        title: "Type-Safe Fullstack",
        description: "TypeScript-first. Route contracts, Zod validation, and compile-time safety throughout.",
        color: "#DC2626",
      },
      {
        icon: "cpu",
        title: "Zero Config AI",
        description: "AI-readable project graph and deterministic structure. Works perfectly with Copilot and Cursor.",
        color: "#0EA5E9",
      },
    ],
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "/ forever",
        highlighted: false,
        features: [
          "All core features",
          "FiyuuDB (in-memory)",
          "WebSocket channels",
          "Community support",
        ],
      },
      {
        name: "Pro",
        price: "$19",
        period: "/ month",
        highlighted: true,
        features: [
          "Everything in Free",
          "NATS transport",
          "Priority support",
          "Custom adapters",
          "Analytics dashboard",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        highlighted: false,
        features: [
          "Everything in Pro",
          "SLA guarantee",
          "Dedicated support",
          "On-premise deployment",
          "Custom integrations",
        ],
      },
    ],
    stats: [
      { value: "50kb", label: "Gzip Runtime" },
      { value: "<1ms", label: "Query Latency" },
      { value: "0", label: "External Deps" },
      { value: "∞", label: "Uptime" },
    ],
    testimonials: [
      {
        name: "Ahmet Yilmaz",
        role: "Fullstack Developer",
        text: "I shipped a realtime dashboard in 2 days with Fiyuu. The built-in DB and services are genuinely life-saving.",
        avatar: "AY",
      },
      {
        name: "Elif Demir",
        role: "Tech Lead",
        text: "ResponsiveWrapper is brilliantly designed. We can preview desktop and mobile side by side right in the browser.",
        avatar: "ED",
      },
      {
        name: "Can Ozkan",
        role: "Indie Hacker",
        text: "Switched from Next.js and never looked back. The always-live architecture makes a real difference.",
        avatar: "CO",
      },
    ],
    subscriberCount,
  };
}
