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
      description: "Hafif, hızlı ve developer-friendly. MongoDB benzeri built-in DB, realtime kanallar ve background servislerle modern web uygulamaları oluşturun.",
    },
    features: [
      {
        icon: "database",
        title: "Built-in FiyuuDB",
        description: "SQL-like sorgular, in-memory hız, disk persistence. External database sunucusuna gerek yok.",
        color: "#2563EB",
      },
      {
        icon: "zap",
        title: "Realtime Channels",
        description: "WebSocket ve NATS ile anlık bildirimler, live updates ve broadcast mesajları.",
        color: "#16A34A",
      },
      {
        icon: "layers",
        title: "Always-Live Services",
        description: "Background task'lar, scheduled jobs ve cache warming. Uygulamanız hiç durmaz.",
        color: "#7C3AED",
      },
      {
        icon: "smartphone",
        title: "ResponsiveWrapper",
        description: "Tek satırda responsive container + preview butonu. Masaüstü ve mobil görünümü anında test edin.",
        color: "#F59E0B",
      },
      {
        icon: "shield",
        title: "Type-Safe Fullstack",
        description: "TypeScript-first. Route contracts, Zod validasyonu ve compile-time safety.",
        color: "#DC2626",
      },
      {
        icon: "cpu",
        title: "Zero Config AI",
        description: "AI-readable project graph, deterministic structure. Copilot ve Cursor ile mükemmel uyum.",
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
        name: "Ahmet Yılmaz",
        role: "Fullstack Developer",
        text: "Fiyuu ile realtime bir dashboard 2 gunde bitirdim. Built-in DB ve servisler gercekten hayat kurtariyor.",
        avatar: "AY",
      },
      {
        name: "Elif Demir",
        role: "Tech Lead",
        text: "ResponsiveWrapper cok iyi dusunulmus. Component'in masaustu ve mobil gorunumunu ayni anda test edebiliyoruz.",
        avatar: "ED",
      },
      {
        name: "Can Özkan",
        role: "Indie Hacker",
        text: "Next.js'ten gectim ve pisman degilim. Always-live mimarisi gercekten fark yaratiyor.",
        avatar: "CO",
      },
    ],
    subscriberCount,
  };
}
