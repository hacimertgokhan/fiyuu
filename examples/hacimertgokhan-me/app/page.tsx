/**
 * app/page.ts → Route: /
 * 
 * Portfolio - Intent-Based
 */

import { definePage, html, when, memoAsync } from "@fiyuu/core";

// Icons
const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4 6 8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
const iconGithub = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.9a3.3 3.3 0 0 0-.9-2.5c3-.4 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19 5.3 4.8 4.8 0 0 0 18.9 2S17.7 1.6 15 3.4a13.3 13.3 0 0 0-6 0C6.3 1.6 5.1 2 5.1 2a4.8 4.8 0 0 0-.1 3.3A5.2 5.2 0 0 0 3.7 8.9c0 5.2 3.2 6.3 6.2 6.7a3.3 3.3 0 0 0-.9 2.5V22"/></svg>`;
const iconLinkedIn = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M8 11v6m0-9v.01M12 17v-3a2 2 0 1 1 4 0v3"/></svg>`;
const iconExternal = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5m-9 9h9V10M5 14V5h9"/></svg>`;

// Memoized data
const getPortfolio = memoAsync(async () => ({
  fullName: "Hacı Mert Gökhan",
  title: { tr: "Yazılım Geliştirici", en: "Software Developer" },
  location: { tr: "Türkiye", en: "Turkey" },
  about: {
    tr: [
      "Modern web teknolojileri ile uygulamalar geliştiriyorum.",
      "Fiyuu Framework'ün yaratıcısıyım.",
    ],
    en: [
      "I build applications with modern web technologies.",
      "Creator of the Fiyuu Framework.",
    ],
  },
  contacts: {
    email: "hello@hacimertgokhan.me",
    github: "https://github.com/hacimertgokhan",
    linkedin: "https://linkedin.com/in/hacimertgokhan",
  },
  experiences: [
    {
      role: "Software Developer",
      company: "Freelance",
      startDate: "2020",
      endDate: "Present",
      techStack: ["TypeScript", "Node.js", "React", "Vue"],
    },
  ],
  projects: [
    {
      name: "Fiyuu",
      summary: { 
        tr: "AI-native fullstack framework",
        en: "AI-native fullstack framework"
      },
      category: "Framework",
      stack: ["TypeScript", "Node.js"],
      liveUrl: "https://fiyuu.work",
      githubUrl: "https://github.com/hacimertgokhan/fiyuu",
    },
  ],
  githubStats: { stars: 150, forks: 25, commits: 500 },
}), { ttl: 3600, tags: ["portfolio"] });

export default definePage({
  load: () => getPortfolio(),
  
  render: ({ data: profile }) => html`
    <!-- Floating Nav -->
    <aside id="floatbar" style="position:fixed; top:50%; transform:translateY(-50%); left:calc(50% - 32rem - 4.8rem); z-index:40; display:flex; flex-direction:column; gap:0.55rem;">
      <a href="#hero" style="display:inline-flex; align-items:center; justify-content:center; width:2.2rem; height:2.2rem; border-radius:9999px; border:1px solid var(--border); color:var(--text-secondary); background:color-mix(in srgb, var(--bg-primary) 76%, var(--bg-secondary) 24%);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
      </a>
      <a href="#about" style="display:inline-flex; align-items:center; justify-content:center; width:2.2rem; height:2.2rem; border-radius:9999px; border:1px solid var(--border); color:var(--text-secondary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><circle cx="12" cy="8" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 20a7 7 0 0 1 14 0"/></svg>
      </a>
      <a href="#projects" style="display:inline-flex; align-items:center; justify-content:center; width:2.2rem; height:2.2rem; border-radius:9999px; border:1px solid var(--border); color:var(--text-secondary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><rect x="3" y="4" width="18" height="14" rx="2"/><path stroke-linecap="round" d="M8 20h8"/></svg>
      </a>
    </aside>

    <main style="animation:fadeIn 0.3s ease-in-out;">
      <!-- Hero -->
      <section id="hero" style="max-width:64rem; margin:0 auto; padding:1.5rem 1.25rem 1.5rem;">
        <div style="position:relative; border-radius:1.5rem; border:1px solid var(--border); background:linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); padding:1.5rem; md:padding:2.5rem;">
          <p style="font-size:0.75rem; line-height:1.5rem; letter-spacing:0.22em; color:var(--text-muted);">fiyuu / denis / quark / plexus / locai</p>
          <h1 style="margin-top:1rem; font-size:1.875rem; font-weight:900; line-height:1.25; color:var(--text-primary);">${profile.fullName}</h1>
          <p style="margin-top:0.75rem; font-size:1rem; color:var(--accent);">${profile.title.tr}</p>
          <p style="margin-top:0.5rem; font-size:0.875rem; color:var(--text-muted);">${profile.location.tr}</p>
          
          <div style="margin-top:1.5rem; display:flex; flex-wrap:wrap; gap:0.75rem;">
            <a href="mailto:${profile.contacts.email}" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:0.75rem; border:1px solid var(--border); background:var(--bg-primary); padding:0.5rem 1rem; font-size:0.875rem; color:var(--text-primary);">
              ${iconMail} E-posta
            </a>
            <a href="${profile.contacts.github}" target="_blank" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:0.75rem; border:1px solid var(--border); background:var(--bg-primary); padding:0.5rem 1rem; font-size:0.875rem; color:var(--text-primary);">
              ${iconGithub} GitHub
            </a>
            <a href="${profile.contacts.linkedin}" target="_blank" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:0.75rem; border:1px solid var(--border); background:var(--bg-primary); padding:0.5rem 1rem; font-size:0.875rem; color:var(--text-primary);">
              ${iconLinkedIn} LinkedIn
            </a>
          </div>
          
          <!-- Stats -->
          <div style="margin-top:1.5rem; display:grid; grid-template-columns:repeat(3, 1fr); gap:0.625rem; md:absolute; md:bottom:2rem; md:right:2rem; md:margin-top:0; md:width:14rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; border-radius:0.75rem; background:var(--bg-primary); padding:0.5rem 0.75rem; font-size:0.875rem; box-shadow:0 6px 16px rgba(0,0,0,0.08);">
              <span>⭐ Yıldız</span>
              <span style="font-weight:600;">${profile.githubStats.stars}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; border-radius:0.75rem; background:var(--bg-primary); padding:0.5rem 0.75rem; font-size:0.875rem;">
              <span>🍴 Fork</span>
              <span style="font-weight:600;">${profile.githubStats.forks}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; border-radius:0.75rem; background:var(--bg-primary); padding:0.5rem 0.75rem; font-size:0.875rem;">
              <span>💻 Commit</span>
              <span style="font-weight:600;">${profile.githubStats.commits}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- About -->
      <section id="about" style="max-width:64rem; margin:0 auto; padding:1.25rem 1.25rem;">
        <h2 style="font-size:0.875rem; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--text-muted);">Hakkımda</h2>
        <div style="margin-top:1rem; border-radius:1.5rem; border:1px solid var(--border); background:color-mix(in srgb, var(--bg-secondary) 55%, var(--bg-primary) 45%); padding:1.25rem;">
          ${profile.about.tr.map(p => html`<p style="font-size:1rem; line-height:1.75rem; color:var(--text-secondary);">${p}</p>`).join('')}
        </div>
      </section>

      <!-- Projects -->
      <section id="projects" style="max-width:64rem; margin:0 auto; padding:1.25rem 1.25rem 3rem;">
        <h2 style="font-size:0.875rem; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--text-muted);">Projelerim</h2>
        <div style="margin-top:1rem; display:grid; gap:1rem; md:grid-cols:2;">
          ${profile.projects.map(project => html`
            <article style="position:relative; overflow:hidden; border-radius:1rem; background:linear-gradient(165deg, color-mix(in srgb, var(--bg-secondary) 78%, var(--bg-primary) 22%), var(--bg-primary)); box-shadow:0 14px 36px color-mix(in srgb, var(--bg-primary) 65%, #000 35% / 12%); padding:1.25rem; border-top:3px solid var(--accent);">
              <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem;">
                <h3 style="font-size:1.125rem; font-weight:700; color:var(--text-primary);">${project.name}</h3>
                <span style="display:inline-flex; border-radius:9999px; background:var(--bg-primary); padding:0.25rem 0.625rem; font-size:0.6875rem; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted);">${project.category}</span>
              </div>
              <p style="margin-top:0.75rem; font-size:0.875rem; line-height:1.75rem; color:var(--text-secondary);">${project.summary.tr}</p>
              <div style="margin-top:1rem; display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${project.stack.map(s => html`<span style="border-radius:9999px; background:color-mix(in srgb, var(--bg-primary) 84%, var(--bg-secondary) 16%); padding:0.375rem 0.625rem; font-size:0.75rem; color:var(--text-secondary);">${s}</span>`).join('')}
              </div>
              <div style="margin-top:1.25rem; display:flex; gap:0.75rem;">
                <a href="${project.liveUrl}" target="_blank" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:0.75rem; background:var(--bg-primary); padding:0.5rem 0.75rem; font-size:0.875rem; box-shadow:0 6px 16px rgba(0,0,0,0.08);">
                  ${iconExternal} Live
                </a>
                <a href="${project.githubUrl}" target="_blank" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:0.75rem; background:var(--bg-primary); padding:0.5rem 0.75rem; font-size:0.875rem;">
                  ${iconGithub} Source
                </a>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <footer style="display:flex; width:100%; align-items:center; justify-content:center; gap:0.25rem; padding:1.5rem 1.25rem; text-align:center; font-size:0.875rem; color:var(--text-muted);">
        built with <a href="https://fiyuu.work" style="color:var(--accent);">fiyuu</a>
      </footer>
    </main>
  `,
  
  seo: {
    meta: {
      title: "Hacı Mert Gökhan | Yazılım Geliştirici",
      description: "Software developer portfolio - Creator of Fiyuu Framework",
      og: { type: "profile" },
    },
    sitemap: {
      priority: 1.0,
      changefreq: "weekly",
    },
  },
  
  cache: {
    revalidate: 3600,
    tags: ["portfolio"],
  },
});
