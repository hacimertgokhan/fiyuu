import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    posts: z.array(z.object({
      slug: z.string(),
      title: z.string(),
      excerpt: z.string(),
      author: z.string(),
      date: z.string(),
      tags: z.array(z.string()),
      readTime: z.number(),
      coverColor: z.string(),
    })),
    stats: z.object({
      totalPosts: z.number(),
      totalViews: z.number(),
      totalComments: z.number(),
    }),
  }),
  description: "Blog homepage query - fetches all posts with stats",
});

export async function execute() {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();

  await db.initialize();

  // Seed sample posts if empty
  const existingPosts = db.table("posts");
  if (existingPosts.count === 0) {
    await db.seed("posts", [
      {
        slug: "fiyuu-fullstack-framework",
        title: "Fiyuu: Hafif Fullstack Framework",
        excerpt: "Next.js'in karmaşıklığından sıkıldınız mı? Fiyuu ile temiz, fast ve fullstack uygulamalar geliştirin. DB, realtime ve servisler built-in.",
        author: "Hacimert Gokhan",
        date: "2026-03-30",
        tags: ["framework", "typescript", "fullstack"],
        readTime: 8,
        coverColor: "#2563EB",
        views: 142,
        content: `# Fiyuu: Hafif Fullstack Framework\n\nFiyuu, modern web uygulamaları için tasarlanmış, hafif ve always-live bir fullstack framework'tür.\n\n## Neden Fiyuu?\n\n- **Built-in DB**: Hiç external dependency yok. In-memory + disk persistence.\n- **Realtime Channels**: WebSocket ve NATS desteği.\n- **Service Lifecycle**: Uygulamanız sürekli canlı.\n- **SQL-like Queries**:amiliar SQL syntax.\n\n## Örnek Kullanım\n\n\`\`\`typescript\nimport { db } from "@fiyuu/db";\n\nconst users = await db.query("SELECT * FROM users WHERE active = ?", [true]);\nawait db.query("INSERT INTO posts (title, content) VALUES (?, ?)", ["Hello", "World"]);\n\`\`\`\n\nFiyuu ile fullstack development artık çok daha kolay!`,
      },
      {
        slug: "realtime-features",
        title: "Real-time Bildirim Sistemi Nasıl Yapılır?",
        excerpt: "WebSocket ve kanal tabanlı messaging ile kullanıcılarınıza anlık bildirimler gönderin. Fiyuu ile 5 dakikada real-time sistem.",
        author: "Hacimert Gokhan",
        date: "2026-03-28",
        tags: ["realtime", "websocket", "notifications"],
        readTime: 6,
        coverColor: "#16A34A",
        views: 98,
        content: `# Real-time Bildirim Sistemi\n\nModern uygulamaların vazgeçilmezi: anlık bildirimler.\n\n## Fiyuu ile Realtime\n\nFiyuu, WebSocket ve NATS transport'larını built-in olarak sunar.\n\n### Server-side\n\n\`\`\`typescript\nimport { defineService } from "@fiyuu/runtime";\n\nexport default defineService({\n  name: "notifications",\n  start({ realtime, db }) {\n    const notif = realtime.channel("notifications");\n    \n    notif.on("new-comment", async (data) => {\n      // Yorum bildirimi gönder\n      notif.broadcast("push", {\n        type: "comment",\n        message: \`\${data.author} yorum yaptı\`,\n      });\n    });\n  },\n});\n\`\`\`\n\n### Client-side\n\n\`\`\`javascript\nconst notif = fiyuu.channel("notifications");\nnotif.on("push", (data) => {\n  showNotification(data.message);\n});\n\`\`\`\n\nBu kadar basit!`,
      },
      {
        slug: "database-queries",
        title: "FiyuuDB ile SQL-like Sorgular",
        excerpt: "Built-in veritabanı ile external bir servise ihtiyaç duymadan verilerinizi yönetin. MongoDB benzeri API, SQL-like syntax.",
        author: "Hacimert Gokhan",
        date: "2026-03-25",
        tags: ["database", "sql", "fiyuudb"],
        readTime: 10,
        coverColor: "#7C3AED",
        views: 167,
        content: `# FiyuuDB ile SQL-like Sorgular\n\nFiyuu'nun built-in veritabanı, hafif ve güçlü bir çözüm sunar.\n\n## Tablo Oluşturma\n\n\`\`\`typescript\nimport { defineTable } from "@fiyuu/db";\n\nconst usersTable = defineTable({\n  name: "users",\n  columns: {\n    id: { type: "string", primaryKey: true },\n    name: { type: "string", nullable: false },\n    email: { type: "string", unique: true },\n    role: { type: "string", default: "user" },\n    createdAt: { type: "number" },\n  },\n});\n\`\`\`\n\n## Sorgu Örnekleri\n\n\`\`\`typescript\n// SELECT\nconst active = await db.query("SELECT * FROM users WHERE role = ?", ["admin"]);\n\n// INSERT\nawait db.query("INSERT INTO users (name, email) VALUES (?, ?)", ["Ali", "ali@test.com"]);\n\n// UPDATE\nawait db.query("UPDATE users SET role = ? WHERE id = ?", ["admin", "u_123"]);\n\n// DELETE\nawait db.query("DELETE FROM users WHERE createdAt < ?", [threshold]);\n\n// GROUP BY\nconst stats = await db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");\n\`\`\`\n\n## Table API\n\nAyrıca MongoDB-style filter API da mevcut:\n\n\`\`\`typescript\nconst table = db.table("users");\nconst admins = table.find({ role: "admin" });\nconst one = table.findOne({ email: "a@b.com" });\ntable.insert({ name: "Test", email: "test@test.com" });\n\`\`\``,
      },
      {
        slug: "always-live-architecture",
        title: "Always-Live Mimarisi: Next.js'ten Fark Nedir?",
        excerpt: "Next.js request-response modeli yerine, Fiyuu'nun always-live architecture'ı nedir, ne avantaj sağlar, hangi durumlarda tercih edilmeli?",
        author: "Hacimert Gokhan",
        date: "2026-03-20",
        tags: ["architecture", "comparison", "services"],
        readTime: 12,
        coverColor: "#DC2626",
        views: 234,
        content: `# Always-Live Mimarisi\n\nGeleneksel SSR framework'ler (Next.js, Remix) request-response modeliyle çalışır.\n\n## Fark Nedir?\n\n### Next.js (Request-Driven)\n- Her istek için sunucu işlemleri\n- Serverless Functions / Edge Functions\n- Cold start sorunu\n- State her istekte sıfırlanır\n\n### Fiyuu (Always-Live)\n- Sürekli çalışan process\n- Memory'de persistent state\n- Background service'ler\n- Cold start yok\n\n## Ne Zaman Always-Live?\n\n1. **Real-time uygulamalar** - Chat, bildirim, live dashboard\n2. **Background jobs** - Veri senkronizasyonu, cache warming\n3. **WebSocket server** - Sürekli bağlantı gerektiren uygulamalar\n4. **In-memory database** - Hızlı veri erişimi\n\n## Fiyuu Service Örneği\n\n\`\`\`typescript\nexport default defineService({\n  name: "cache-warmer",\n  async start({ db, log }) {\n    // Uygulama başlarken cache'i doldur\n    const popular = await db.query("SELECT * FROM posts ORDER BY views DESC LIMIT 10");\n    cache.set("popular-posts", popular);\n    \n    // Her 5 dakikada güncelle\n    setInterval(async () => {\n      const fresh = await db.query("SELECT * FROM posts ORDER BY views DESC LIMIT 10");\n      cache.set("popular-posts", fresh);\n      log("info", "cache-refreshed");\n    }, 5 * 60 * 1000);\n  },\n});\n\`\`\``,
      },
    ]);
  }

  const posts = db.table("posts").find({}) as unknown as Array<{
    slug: string; title: string; excerpt: string; author: string;
    date: string; tags: string[]; readTime: number; coverColor: string; views: number;
  }>;

  const sorted = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const commentsTable = db.table("comments");

  return {
    posts: sorted.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      author: p.author,
      date: p.date,
      tags: p.tags,
      readTime: p.readTime,
      coverColor: p.coverColor,
    })),
    stats: {
      totalPosts: posts.length,
      totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
      totalComments: commentsTable.count,
    },
  };
}
