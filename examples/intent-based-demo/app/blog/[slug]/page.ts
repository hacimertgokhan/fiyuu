/**
 * app/blog/[slug]/page.ts → Route: /blog/:slug
 * 
 * Dinamik SEO - content'den otomatik meta üretimi
 */

import { definePage, html, generateJsonLd } from "@fiyuu/core";
import { z } from "zod";

// Mock DB
const posts: Record<string, { title: string; content: string; author: string; date: string }> = {
  "hello-world": {
    title: "Hello World - Fiyuu ile Modern Web",
    content: `
      <p>Fiyuu, AI-native fullstack framework'tür. Intent-based programming ile 
      karmaşıklığı azaltır, hızı artırır.</p>
      <h2>Özellikler</h2>
      <ul>
        <li>File-based routing</li>
        <li>Intent-based API</li>
        <li>Auto SEO</li>
      </ul>
    `,
    author: "Hacı Mert Gökhan",
    date: "2024-01-15",
  },
};

export default definePage({
  input: {
    params: z.object({ slug: z.string() }),
  },
  
  load: ({ params }) => posts[params.slug],
  
  render: ({ data: post, error }) => {
    if (error || !post) {
      return html`<h1>Post bulunamadı</h1>`;
    }
    
    return html`
      <article>
        <h1>${post.title}</h1>
        <p class="meta">${post.author} · ${post.date}</p>
        <div class="content">${post.content}</div>
      </article>
    `;
  },
  
  // SEO - Content'den otomatik üret + manuel override
  seo: {
    // Statik meta veya fonksiyon
    meta: (post) => ({
      title: post?.title,
      // Description otomatik content'den çıkarılacak
      og: {
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        creator: "@hacimertgokhan",
      },
    }),
    
    // AI/otomatik SEO
    generate: {
      generateTitle: (post) => `${post.title} | Fiyuu Blog`,
      generateDescription: (post, content) => {
        // Content'den ilk 160 karakter
        const text = content?.replace(/<[^>]+>/g, " ").trim() || "";
        return text.slice(0, 160) + (text.length > 160 ? "..." : "");
      },
      suggestKeywords: (post, content) => {
        // Basit keyword extraction
        const words = content?.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const freq: Record<string, number> = {};
        words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
        return Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([w]) => w);
      },
    },
    
    // Content'den tam otomatik SEO
    auto: {
      titleSelector: "h1",
      descSelector: ".content p:first-child",
      imageSelector: "img",
    },
    
    // Structured data
    sitemap: {
      priority: 0.8,
      changefreq: "weekly",
    },
  },
  
  // Cache - ISR
  cache: {
    revalidate: 3600, // 1 saat
    tags: ["blog", "posts"],
  },
});
