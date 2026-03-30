import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type BlogData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Blog homepage - displays all posts with stats" });

const icon = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  post: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>`,
};

export default class BlogHomePage extends Component<PageProps<BlogData>> {
  template({ data }: PageProps<BlogData> = this.props) {
    const blog = data ?? {
      posts: [],
      stats: { totalPosts: 0, totalViews: 0, totalComments: 0 },
    };

    const postsHtml = blog.posts
      .map(
        (post, idx) => html`
          <article
            class="post-card animate-slide-up"
            style="animation-delay:${idx * 80}ms; animation-fill-mode:both;"
            data-post-card
            data-title="${escapeHtml(post.title.toLowerCase())}"
            data-tags="${post.tags.map((t) => escapeHtml(t.toLowerCase())).join(",")}"
          >
            <div class="post-cover" style="background: linear-gradient(135deg, ${post.coverColor}18, ${post.coverColor}08);">
              <div class="post-cover-stripe" style="background: ${post.coverColor};"></div>
            </div>
            <div class="post-body">
              <div class="post-tags">
                ${post.tags.map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`).join("")}
              </div>
              <h2 class="post-title">
                <a href="/posts/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
              </h2>
              <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
              <div class="post-meta">
                <span class="post-author">${escapeHtml(post.author)}</span>
                <span class="meta-dot">&middot;</span>
                <span class="post-date">${escapeHtml(post.date)}</span>
                <span class="meta-dot">&middot;</span>
                <span>${icon.clock} ${post.readTime} dk</span>
              </div>
            </div>
          </article>
        `,
      )
      .join("");

    return html`
      <style>
        /* Header */
        .site-header {
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        .site-header-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .site-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
          color: var(--text-primary);
          font-weight: 700;
          font-size: 1.125rem;
        }
        .site-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 0.75rem;
        }
        .site-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .site-nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-sm);
        }
        .site-nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
        .theme-btn {
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .theme-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent);
        }
        .theme-btn svg { width: 16px; height: 16px; }

        /* Hero */
        .hero {
          max-width: 72rem;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 1.5rem;
        }
        .hero h1 {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .hero p {
          margin-top: 0.5rem;
          color: var(--text-secondary);
          font-size: 1rem;
          max-width: 560px;
        }

        /* Stats */
        .stats {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 1.5rem 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }
        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--accent-light);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon svg { width: 18px; height: 18px; }
        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .stat-label {
          font-size: 0.6875rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }

        /* Search */
        .search-bar {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 1.5rem 1.25rem;
        }
        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.625rem 0.875rem;
          max-width: 400px;
          color: var(--text-muted);
        }
        .search-input-wrap svg { width: 16px; height: 16px; flex-shrink: 0; }
        .search-input-wrap input {
          border: none;
          background: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.8125rem;
          width: 100%;
          font-family: var(--font-sans);
        }
        .search-input-wrap input::placeholder { color: var(--text-muted); }

        /* Posts Grid */
        .posts-section {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
        }
        .posts-grid {
          display: grid;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .posts-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .posts-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .post-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .post-cover {
          height: 6px;
          position: relative;
        }
        .post-cover-stripe {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }
        .post-body {
          padding: 1rem 1.25rem 1.25rem;
        }
        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.625rem;
        }
        .post-tag {
          background: var(--bg-tertiary);
          color: var(--text-muted);
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.1875rem 0.5rem;
          border-radius: var(--radius-xs);
        }
        .post-title {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 0.375rem;
        }
        .post-title a {
          color: var(--text-primary);
          text-decoration: none;
        }
        .post-title a:hover { color: var(--accent); }
        .post-excerpt {
          color: var(--text-secondary);
          font-size: 0.8125rem;
          line-height: 1.55;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .post-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
        .post-meta svg { width: 12px; height: 12px; }
        .meta-dot { color: var(--border); }
        .post-author { font-weight: 600; color: var(--text-secondary); }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        /* Footer */
        .site-footer {
          border-top: 1px solid var(--border);
          padding: 1.25rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-top: auto;
        }
        .site-footer a { color: var(--accent); text-decoration: none; }
        .site-footer a:hover { text-decoration: underline; }
      </style>

      <!-- Header -->
      <header class="site-header">
        <div class="site-header-inner">
          <a href="/" class="site-logo">
            <span class="site-logo-mark">Fi</span>
            <span>Fiyuu Blog</span>
          </a>
          <nav class="site-nav">
            <a href="/" class="site-nav-link">Yazılar</a>
            <a href="/posts/fiyuu-fullstack-framework" class="site-nav-link">Örnek</a>
            <button id="theme-toggle" class="theme-btn" type="button" aria-label="Tema değiştir">
              ${icon.moon}
            </button>
          </nav>
        </div>
      </header>

      <!-- Hero -->
      <section class="hero animate-fade-in">
        <h1>Fiyuu Blog</h1>
        <p>Fullstack framework üzerine yazılar, tutoraller ve örnekler.</p>
      </section>

      <!-- Stats -->
      <div class="stats">
        <div class="stat-card animate-slide-up" style="animation-delay:100ms; animation-fill-mode:both;">
          <div class="stat-icon">${icon.post}</div>
          <div>
            <div class="stat-value">${blog.stats.totalPosts}</div>
            <div class="stat-label">Yazı</div>
          </div>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay:150ms; animation-fill-mode:both;">
          <div class="stat-icon">${icon.eye}</div>
          <div>
            <div class="stat-value">${blog.stats.totalViews.toLocaleString()}</div>
            <div class="stat-label">Görüntülenme</div>
          </div>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay:200ms; animation-fill-mode:both;">
          <div class="stat-icon">${icon.comment}</div>
          <div>
            <div class="stat-value">${blog.stats.totalComments}</div>
            <div class="stat-label">Yorum</div>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <div class="search-input-wrap">
          ${icon.search}
          <input type="text" id="search-input" placeholder="Yazılarda ara..." autocomplete="off" />
        </div>
      </div>

      <!-- Posts -->
      <section class="posts-section">
        <div class="posts-grid" id="posts-grid">
          ${postsHtml}
        </div>
        ${blog.posts.length === 0 ? html`
          <div class="empty-state">
            <p>Henüz yazı yok.</p>
          </div>
        ` : ""}
      </section>

      <!-- Footer -->
      <footer class="site-footer">
        Built with <a href="https://fiyuu.work">Fiyuu</a>
      </footer>

      <!-- Search Script -->
      <script>
        (function() {
          var input = document.getElementById("search-input");
          if (!input) return;
          input.addEventListener("input", function(e) {
            var q = e.target.value.toLowerCase().trim();
            var cards = document.querySelectorAll("[data-post-card]");
            for (var i = 0; i < cards.length; i++) {
              var card = cards[i];
              var title = card.getAttribute("data-title") || "";
              var tags = card.getAttribute("data-tags") || "";
              var visible = !q || title.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
              card.style.display = visible ? "" : "none";
            }
          });
        })();
      </script>
    `;
  }
}
