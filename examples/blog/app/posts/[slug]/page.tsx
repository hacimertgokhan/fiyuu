import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PostData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Blog post detail with comments" });

export default class PostDetailPage extends Component<PageProps<PostData>> {
  template({ data, params }: PageProps<PostData> & { params: Record<string, string> } = this.props) {
    const post = data?.post ?? {
      slug: params?.slug ?? "",
      title: "Post not found",
      content: "",
      author: "",
      date: "",
      tags: [],
      readTime: 0,
      coverColor: "#999",
      views: 0,
    };
    const comments = data?.comments ?? [];
    const relatedPosts = data?.relatedPosts ?? [];

    const iconBack = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
    const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
    const iconEye = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const iconSend = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>`;

    // Convert markdown-like content to HTML (simplified)
    const contentHtml = post.content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<)(.*$)/gm, (match: string) => {
        if (match.trim() === '') return '';
        return match;
      });

    const commentsHtml = comments
      .map(
        (c: { id: string; author: string; text: string; createdAt: number }) => html`
          <div class="comment-item animate-slide-up">
            <div class="comment-header">
              <span class="comment-author">${c.author}</span>
              <span class="comment-date">${new Date(c.createdAt).toLocaleDateString("tr-TR")}</span>
            </div>
            <p class="comment-text">${c.text}</p>
          </div>
        `,
      )
      .join("");

    const relatedHtml = relatedPosts
      .map(
        (r: { slug: string; title: string; excerpt: string; coverColor: string }) => html`
          <a href="/posts/${r.slug}" class="related-card">
            <div class="related-accent" style="background:${r.coverColor};"></div>
            <div class="related-content">
              <h4>${r.title}</h4>
              <p>${r.excerpt.slice(0, 80)}...</p>
            </div>
          </a>
        `,
      )
      .join("");

    return html`
      <style>
        .post-header {
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }
        .post-header-inner {
          max-width: 48rem;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
        }
        .back-btn:hover { color: var(--accent); background: var(--bg-tertiary); }
        .post-header-title {
          font-size: 0.875rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-detail {
          max-width: 48rem;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }
        .post-tags {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .post-tag {
          background: var(--accent-light);
          color: var(--accent);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
        }
        .post-detail h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.25;
          margin-bottom: 1rem;
        }
        .post-detail-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
        }
        .post-detail-meta .separator { color: var(--border); }
        .post-detail-meta .views {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .post-body {
          font-family: var(--font-serif);
          line-height: 1.85;
          color: var(--text-secondary);
        }
        .post-body h1, .post-body h2, .post-body h3 {
          font-family: var(--font-sans);
          color: var(--text-primary);
          font-weight: 700;
          margin: 2rem 0 0.75rem;
        }
        .post-body h1 { font-size: 1.75rem; }
        .post-body h2 { font-size: 1.375rem; }
        .post-body h3 { font-size: 1.125rem; }
        .post-body p { margin-bottom: 1.25rem; }
        .post-body code {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.875em;
          font-family: 'JetBrains Mono', monospace;
        }
        .post-body pre {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .post-body pre code {
          background: none;
          border: none;
          padding: 0;
        }

        /* Comments Section */
        .comments-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .comments-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }
        .comment-form {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .form-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .form-input, .form-textarea {
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: var(--font-sans);
          outline: none;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-textarea { resize: vertical; min-height: 80px; }
        .form-submit {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-sans);
        }
        .form-submit:hover { background: var(--accent-hover); }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-status {
          margin-top: 0.75rem;
          font-size: 0.8125rem;
          color: var(--success);
          display: none;
        }

        .comment-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 0.75rem;
        }
        .comment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .comment-author { font-weight: 600; color: var(--text-primary); font-size: 0.875rem; }
        .comment-date { color: var(--text-muted); font-size: 0.75rem; }
        .comment-text { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; }

        /* Related */
        .related-section {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .related-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .related-card {
          display: flex;
          gap: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          text-decoration: none;
          transition: transform 0.2s ease;
        }
        .related-card:hover { transform: translateY(-1px); }
        .related-accent { width: 4px; }
        .related-content { padding: 0.875rem 1rem; }
        .related-content h4 { color: var(--text-primary); font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem; }
        .related-content p { color: var(--text-muted); font-size: 0.75rem; }
      </style>

      <!-- Header -->
      <header class="post-header">
        <div class="post-header-inner">
          <a href="/" class="back-btn">${iconBack} Yazılar</a>
          <span class="post-header-title">${post.title}</span>
        </div>
      </header>

      <!-- Post Content -->
      <article class="post-detail animate-fade-in">
        <div class="post-tags">
          ${post.tags.map((tag: string) => `<span class="post-tag">${tag}</span>`).join("")}
        </div>
        <h1>${post.title}</h1>
        <div class="post-detail-meta">
          <span>${post.author}</span>
          <span class="separator">·</span>
          <span>${post.date}</span>
          <span class="separator">·</span>
          <span>${iconClock} ${post.readTime} dk okuma</span>
          <span class="separator">·</span>
          <span class="views">${iconEye} ${post.views}</span>
        </div>
        <div class="post-body prose">
          <p>${contentHtml}</p>
        </div>

        <!-- Comments -->
        <section class="comments-section">
          <h2 class="comments-title">Yorumlar (${comments.length})</h2>

          <div class="comment-form">
            <div class="form-row">
              <input type="text" id="comment-author" class="form-input" placeholder="Adınız" maxlength="50" />
            </div>
            <div class="form-row">
              <textarea id="comment-text" class="form-textarea" placeholder="Yorumunuzu yazın..." maxlength="1000"></textarea>
            </div>
            <button type="button" id="comment-submit" class="form-submit">
              ${iconSend} Gönder
            </button>
            <div id="comment-status" class="form-status"></div>
          </div>

          <div id="comments-list">
            ${commentsHtml}
          </div>
          ${comments.length === 0 ? html`<p style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:1.5rem;">Henüz yorum yok. İlk yorumu siz yazın!</p>` : ""}
        </section>

        <!-- Related Posts -->
        ${relatedPosts.length > 0 ? html`
          <section class="related-section">
            <h3 class="related-title">İlgili Yazılar</h3>
            ${relatedHtml}
          </section>
        ` : ""}
      </article>

      <!-- Comment Script -->
      <script>
        (function() {
          var slug = ${JSON.stringify(post.slug)};
          var submitBtn = document.getElementById("comment-submit");
          var statusEl = document.getElementById("comment-status");
          var commentsList = document.getElementById("comments-list");

          submitBtn.addEventListener("click", async function() {
            var author = document.getElementById("comment-author").value.trim();
            var text = document.getElementById("comment-text").value.trim();
            if (!author || !text) {
              statusEl.style.display = "block";
              statusEl.style.color = "var(--danger)";
              statusEl.textContent = "Ad ve yorum alanları zorunlu.";
              return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Gönderiliyor...";

            try {
              var result = await fiyuu.action("/posts/" + slug, {
                postSlug: slug,
                author: author,
                text: text,
              });

              if (result && result.success) {
                statusEl.style.display = "block";
                statusEl.style.color = "var(--success)";
                statusEl.textContent = "Yorum eklendi!";
                document.getElementById("comment-author").value = "";
                document.getElementById("comment-text").value = "";

                // Broadcast new comment via realtime (optional, may fail if WS not connected)
                try {
                  fiyuu.channel("notifications").emit("new-comment", {
                    postSlug: slug,
                    author: author,
                  });
                } catch(_) {}

                setTimeout(function() { location.reload(); }, 1000);
              } else {
                throw new Error("Failed");
              }
            } catch(e) {
                statusEl.style.display = "block";
                statusEl.style.color = "var(--success)";
                statusEl.textContent = "Yorum eklendi!";
                
            } finally {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '${iconSend} Gönder';
            }
          });
        })();
      </script>
    `;
  }
}
