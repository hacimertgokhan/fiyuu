import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type InferQueryOutput, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PortfolioData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Personal CV-style portfolio page" });

export default class HomePage extends Component<PageProps<PortfolioData>> {
  template({ data }: PageProps<PortfolioData> = this.props) {
    const iconMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4 6 8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
    const iconGithub = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.9a3.3 3.3 0 0 0-.9-2.5c3-.4 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19 5.3 4.8 4.8 0 0 0 18.9 2S17.7 1.6 15 3.4a13.3 13.3 0 0 0-6 0C6.3 1.6 5.1 2 5.1 2a4.8 4.8 0 0 0-.1 3.3A5.2 5.2 0 0 0 3.7 8.9c0 5.2 3.2 6.3 6.2 6.7a3.3 3.3 0 0 0-.9 2.5V22"/></svg>`;
    const iconLinkedIn = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M8 11v6m0-9v.01M12 17v-3a2 2 0 1 1 4 0v3"/></svg>`;
    const iconExternal = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5m-9 9h9V10M5 14V5h9"/></svg>`;
    const iconStar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="m12 3.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.6l-5.6 2.9 1.1-6.1L3 10.1l6.2-.9z"/></svg>`;
    const iconFork = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.2 7.2 10.7 15M15.8 7.2 13.3 15"/></svg>`;
    const iconCommit = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><circle cx="12" cy="12" r="3.2"/><path stroke-linecap="round" d="M3 12h5m8 0h5"/></svg>`;

    const profile: PortfolioData = data ?? {
      fullName: "Hacimert Gokhan",
      title: { tr: "Yazılım Geliştirici", en: "Software Developer" },
      location: { tr: "Türkiye", en: "Turkey" },
      about: { tr: [], en: [] },
      experiences: [],
      projects: [],
      githubStats: {
        stars: 0,
        forks: 0,
        commits: 0,
      },
      contacts: {
        email: "hello@hacimertgokhan.me",
        github: "https://github.com/hacimertgokhan",
        linkedin: "https://www.linkedin.com/in/hacimertgokhan",
      },
    };

    const aboutHtml = profile.about.tr
      .map((paragraph, idx) => `<p data-i18n-tr="${escapeHtml(paragraph)}" data-i18n-en="${escapeHtml(profile.about.en[idx] ?? paragraph)}" class="text-base md:text-lg leading-8 text-[color:var(--text-secondary)]">${escapeHtml(paragraph)}</p>`)
      .join("");

    const experiencesHtml = profile.experiences
      .map(
        (exp, idx) => html`
          <article class="experience-row ${idx % 2 === 0 ? "is-left" : "is-right"} animate-slide-up" style="animation-delay:${idx * 110}ms; animation-fill-mode: both;">
            <div class="experience-card experience-text rounded-2xl p-5 md:p-6">
              <h3 class="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">${escapeHtml(exp.role)}</h3>
              <p class="experience-company mt-1 text-sm md:text-base">${escapeHtml(exp.company)}</p>
              <div class="experience-stack mt-3">
                ${exp.techStack.map((item) => `<span class="experience-chip">${escapeHtml(item)}</span>`).join("")}
              </div>
            </div>
            <div class="experience-dot" aria-hidden="true"></div>
          </article>
        `,
      )
      .join("");

    const projectsHtml = profile.projects
      .map(
        (project, idx) => html`
          <article class="project-card p-5 md:p-6 animate-slide-up" data-project-card="true" data-category="${escapeHtml(project.category)}" style="animation-delay:${idx * 120}ms; animation-fill-mode: both;">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">${escapeHtml(project.name)}</h3>
              <span class="inline-flex rounded-full bg-[color:var(--bg-primary)] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-muted)]">${escapeHtml(project.category)}</span>
            </div>
            <p data-i18n-tr="${escapeHtml(project.summary.tr)}" data-i18n-en="${escapeHtml(project.summary.en)}" class="mt-3 text-sm md:text-base leading-7 text-[color:var(--text-secondary)]">${escapeHtml(project.summary.tr)}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              ${project.stack
                .map((item) => `<span class="rounded-full bg-[color:var(--bg-primary)]/70 px-2.5 py-1 text-xs text-[color:var(--text-secondary)]">${escapeHtml(item)}</span>`)
                .join("")}
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <a href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noreferrer" data-i18n-live="true" class="inline-flex items-center gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-primary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:text-[color:var(--accent)]">
                ${iconExternal}
                Live
              </a>
              <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noreferrer" data-i18n-source="true" class="inline-flex items-center gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-primary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:text-[color:var(--accent)]">
                ${iconGithub}
                Source
              </a>
            </div>
          </article>
        `,
      )
      .join("");

    const categoryLabels: Record<string, string> = {
      all: "Tümü",
      IDE: "IDE",
      "Database Engine": "Veritabanı Motoru",
      SaaS: "SaaS",
      B2B: "B2B",
    };

    const projectCategories = ["all", ...new Set(profile.projects.map((project) => project.category))];
    const projectTabsHtml = projectCategories
      .map(
        (category, idx) =>
          `<button type="button" class="project-tab" data-category="${escapeHtml(category)}" data-active="${idx === 0 ? "true" : "false"}">${escapeHtml(categoryLabels[category] ?? category)}</button>`,
      )
      .join("");

    const statsHtml = [
      { key: "stars", label: "Yıldız", value: profile.githubStats.stars, icon: iconStar },
      { key: "forks", label: "Fork", value: profile.githubStats.forks, icon: iconFork },
      { key: "commits", label: "Commit", value: profile.githubStats.commits, icon: iconCommit },
    ]
      .map(
        (stat) => html`
          <div class="inline-flex w-full items-center justify-between gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-secondary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <span class="inline-flex items-center gap-2">
              ${stat.icon}
              <span data-stat-label="${escapeHtml(stat.key)}" class="text-[color:var(--text-muted)]">${escapeHtml(stat.label)}</span>
            </span>
            <span class="text-[color:var(--text-primary)] font-semibold">${escapeHtml(stat.value.toLocaleString("en-US"))}</span>
          </div>
        `,
      )
      .join("");

    return html`
      <aside id="floatbar" class="floating-nav hidden xl:flex">
        <a id="nav-hero" href="#hero" class="float-item" data-target="hero" data-active="true" aria-label="Ana bölüm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
        </a>
        <a id="nav-about" href="#about" class="float-item" data-target="about" data-active="false" aria-label="Hakkımda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><circle cx="12" cy="8" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 20a7 7 0 0 1 14 0"/></svg>
        </a>
        <a id="nav-experience" href="#experience" class="float-item" data-target="experience" data-active="false" aria-label="Tecrübelerim">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="3" y="5" width="18" height="16" rx="2"/><path stroke-linecap="round" d="M16 3v4M8 3v4M3 11h18"/></svg>
        </a>
        <a id="nav-projects" href="#projects" class="float-item" data-target="projects" data-active="false" aria-label="Projelerim">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="3" y="4" width="18" height="14" rx="2"/><path stroke-linecap="round" d="M8 20h8"/></svg>
        </a>
        <button id="theme-toggle" class="float-item" type="button" aria-label="Temayı değiştir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
          <span id="theme-label" class="hidden">Dark</span>
        </button>
        <button id="locale-toggle" class="float-item" type="button" aria-label="Dili değiştir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
          <span id="locale-label" class="hidden">TR</span>
        </button>
      </aside>

      <main class="animate-fade-in">
        <section id="hero" class="mx-auto max-w-5xl px-5 pt-10 pb-6 sm:px-8 md:pt-16">
          <div class="relative rounded-3xl border border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(217,119,87,0.14),_transparent_45%),linear-gradient(180deg,var(--bg-secondary)_0%,var(--bg-primary)_100%)] p-6 md:p-10 md:pr-72">
            <p id="hero-tags" class="text-xs tracking-[0.22em] text-[color:var(--text-muted)]">fiyuu / denis / quark / plexus / locai</p>
            <h1 class="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-[color:var(--text-primary)]">${escapeHtml(profile.fullName)}</h1>
            <p id="hero-title" data-i18n-tr="${escapeHtml(profile.title.tr)}" data-i18n-en="${escapeHtml(profile.title.en)}" class="mt-3 text-base sm:text-lg md:text-xl text-[color:var(--accent)]">${escapeHtml(profile.title.tr)}</p>
            <p id="hero-location" data-i18n-tr="${escapeHtml(profile.location.tr)}" data-i18n-en="${escapeHtml(profile.location.en)}" class="mt-2 text-sm md:text-base text-[color:var(--text-muted)]">${escapeHtml(profile.location.tr)}</p>

            <div class="mt-6 flex flex-wrap gap-3">
              <a href="mailto:${escapeHtml(profile.contacts.email)}" class="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                ${iconMail}
                <span id="email-label">E-posta</span>
              </a>
              <a href="${escapeHtml(profile.contacts.github)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                ${iconGithub}
                GitHub
              </a>
              <a href="${escapeHtml(profile.contacts.linkedin)}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                ${iconLinkedIn}
                LinkedIn
              </a>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-2.5 md:absolute md:bottom-8 md:right-8 md:mt-0 md:w-56 md:grid-cols-1">${statsHtml}</div>
          </div>
        </section>

        <section id="about" class="mx-auto max-w-5xl px-5 py-5 sm:px-8 md:py-7">
          <div class="space-y-4">
            <h2 id="heading-about" class="text-sm font-bold tracking-[0.18em] uppercase text-[color:var(--text-muted)] animate-slide-in-left">Hakkımda</h2>
            <div class="space-y-4 rounded-2xl bg-[color:var(--bg-secondary)]/45">${aboutHtml}</div>
          </div>
        </section>

        <section id="experience" class="mx-auto max-w-5xl px-5 pb-8 pt-4 sm:px-8 md:pb-10 md:pt-5">
          <div class="space-y-4 mt-12">
            <h2 id="heading-experience" class="text-sm font-bold tracking-[0.18em] uppercase text-[color:var(--text-muted)] animate-slide-in-left">Tecrübelerim</h2>
            <div class="experience-zigzag">${experiencesHtml}</div>
          </div>
        </section>

        <section id="projects" class="mx-auto max-w-5xl px-5 pb-12 sm:px-8 md:pb-14">
          <div class="space-y-4 mt-12">
            <h2 id="heading-projects" class="text-sm font-bold tracking-[0.18em] uppercase text-[color:var(--text-muted)] animate-slide-in-left">Projelerim</h2>
            <div class="project-tabs">${projectTabsHtml}</div>
            <div class="projects-stage">
              <div id="projects-grid" class="grid gap-4 md:grid-cols-2">${projectsHtml}</div>
            </div>
          </div>
        </section>
      </main>
      
      <footer class="w-full py-4 items-center justify-center flex gap-1">
        this website made with <a class="text-orange-400" href="http://fiyuu.work">fiyuu</a>
      </footer>

      <script type="module">
        (() => {
          const navItems = [...document.querySelectorAll(".float-item[data-target]")];
          const sections = navItems
            .map((item) => document.getElementById(item.getAttribute("data-target") || ""))
            .filter(Boolean);

          const updateActive = () => {
            const anchorY = window.innerHeight * 0.45;
            let activeId = sections[0]?.id || "hero";

            for (const section of sections) {
              const rect = section.getBoundingClientRect();
              if (rect.top <= anchorY) {
                activeId = section.id;
              }
              if (rect.top <= anchorY && rect.bottom > anchorY) {
                activeId = section.id;
                break;
              }
            }

            const pageBottom = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            const isNearBottom = window.scrollY + window.innerHeight >= pageBottom - 4;
            if (isNearBottom && sections.length) {
              activeId = sections[sections.length - 1].id;
            }

            navItems.forEach((item) => {
              const isActive = item.getAttribute("data-target") === activeId;
              item.setAttribute("data-active", isActive ? "true" : "false");
            });
          };

          if (navItems.length && sections.length) {
            window.addEventListener("scroll", updateActive, { passive: true });
            updateActive();
          }

          const tabs = [...document.querySelectorAll(".project-tab")];
          const cards = [...document.querySelectorAll("[data-project-card='true']")];
          const localeToggle = document.getElementById("locale-toggle");
          const localeLabel = document.getElementById("locale-label");

          const i18n = {
            tr: {
              email: "E-posta",
              about: "Hakkımda",
              experience: "Tecrübelerim",
              projects: "Projelerim",
              live: "Canlı",
              source: "Kaynak",
              navHero: "Ana bölüm",
              navAbout: "Hakkımda",
              navExperience: "Tecrübelerim",
              navProjects: "Projelerim",
              stats: { stars: "Yıldız", forks: "Fork", commits: "Commit" },
              categories: { all: "Tümü", IDE: "IDE", "Database Engine": "Veritabanı Motoru", SaaS: "SaaS", B2B: "B2B" },
              locale: "TR",
            },
            en: {
              email: "Email",
              about: "About",
              experience: "Experience",
              projects: "Projects",
              live: "Live",
              source: "Source",
              navHero: "Home",
              navAbout: "About",
              navExperience: "Experience",
              navProjects: "Projects",
              stats: { stars: "Stars", forks: "Forks", commits: "Commits" },
              categories: { all: "All", IDE: "IDE", "Database Engine": "Data & Engine", SaaS: "SaaS", B2B: "B2B" },
              locale: "EN",
            },
          };

          const localeStorageKey = "portfolio-locale";

          const applyLocale = (locale) => {
            const dict = i18n[locale] || i18n.tr;
            document.documentElement.lang = locale;
            const emailLabel = document.getElementById("email-label");
            const headingAbout = document.getElementById("heading-about");
            const headingExperience = document.getElementById("heading-experience");
            const headingProjects = document.getElementById("heading-projects");

            if (emailLabel) emailLabel.textContent = dict.email;
            if (headingAbout) headingAbout.textContent = dict.about;
            if (headingExperience) headingExperience.textContent = dict.experience;
            if (headingProjects) headingProjects.textContent = dict.projects;
            document.getElementById("nav-hero")?.setAttribute("aria-label", dict.navHero);
            document.getElementById("nav-about")?.setAttribute("aria-label", dict.navAbout);
            document.getElementById("nav-experience")?.setAttribute("aria-label", dict.navExperience);
            document.getElementById("nav-projects")?.setAttribute("aria-label", dict.navProjects);

            document.querySelectorAll("[data-stat-label]").forEach((el) => {
              const key = el.getAttribute("data-stat-label") || "stars";
              el.textContent = dict.stats[key] || key;
            });

            document.querySelectorAll("[data-i18n-tr][data-i18n-en]").forEach((el) => {
              const text = locale === "en" ? el.getAttribute("data-i18n-en") : el.getAttribute("data-i18n-tr");
              if (text) {
                el.textContent = text;
              }
            });

            document.querySelectorAll("[data-i18n-live='true']").forEach((el) => {
              const icon = el.querySelector("svg");
              el.textContent = dict.live;
              if (icon) el.prepend(icon);
              el.insertBefore(document.createTextNode(" "), el.children[1] || null);
            });

            document.querySelectorAll("[data-i18n-source='true']").forEach((el) => {
              const icon = el.querySelector("svg");
              el.textContent = dict.source;
              if (icon) el.prepend(icon);
              el.insertBefore(document.createTextNode(" "), el.children[1] || null);
            });

            tabs.forEach((tab) => {
              const key = tab.getAttribute("data-category") || "all";
              tab.textContent = dict.categories[key] || key;
            });

            if (localeLabel) localeLabel.textContent = dict.locale;
            localStorage.setItem(localeStorageKey, locale);
          };

          const applyCategory = (category) => {
            tabs.forEach((tab) => {
              const active = tab.getAttribute("data-category") === category;
              tab.setAttribute("data-active", active ? "true" : "false");
            });

            cards.forEach((card) => {
              const cardCategory = card.getAttribute("data-category");
              const visible = category === "all" || category === cardCategory;
              card.classList.toggle("hidden", !visible);
            });
          };

          tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
              applyCategory(tab.getAttribute("data-category") || "all");
            });
          });

          localeToggle?.addEventListener("click", () => {
            const current = localStorage.getItem(localeStorageKey) === "en" ? "en" : "tr";
            const next = current === "tr" ? "en" : "tr";
            applyLocale(next);
          });

          applyLocale(localStorage.getItem(localeStorageKey) === "en" ? "en" : "tr");
          applyCategory("all");
        })();
      </script>
    `;
  }
}
