import { Component } from "@geajs/core";
import { definePage, html, raw, type InferQueryOutput, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PortfolioData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Personal CV-style portfolio page" });

export default class HomePage extends Component<PageProps<PortfolioData>> {
  template({ data }: PageProps<PortfolioData> = this.props) {
    const iconMail = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="m4 6 8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`);
    const iconGithub = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.9a3.3 3.3 0 0 0-.9-2.5c3-.4 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19 5.3 4.8 4.8 0 0 0 18.9 2S17.7 1.6 15 3.4a13.3 13.3 0 0 0-6 0C6.3 1.6 5.1 2 5.1 2a4.8 4.8 0 0 0-.1 3.3A5.2 5.2 0 0 0 3.7 8.9c0 5.2 3.2 6.3 6.2 6.7a3.3 3.3 0 0 0-.9 2.5V22"/></svg>`);
    const iconLinkedIn = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M8 11v6m0-9v.01M12 17v-3a2 2 0 1 1 4 0v3"/></svg>`);
    const iconExternal = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5m-9 9h9V10M5 14V5h9"/></svg>`);
    const iconStar = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="m12 3.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.6l-5.6 2.9 1.1-6.1L3 10.1l6.2-.9z"/></svg>`);
    const iconFork = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.2 7.2 10.7 15M15.8 7.2 13.3 15"/></svg>`);
    const iconCommit = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><circle cx="12" cy="12" r="3.2"/><path stroke-linecap="round" d="M3 12h5m8 0h5"/></svg>`);

    const profile: PortfolioData = data ?? {
      fullName: "Hacı Mert Gökhan",
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

    const aboutHtml = raw(profile.about.tr
      .map((paragraph, idx) => raw(`<p data-i18n-tr="${paragraph}" data-i18n-en="${profile.about.en[idx] ?? paragraph}" class="text-base md:text-lg leading-8 text-[color:var(--text-secondary)]">${paragraph}</p>`))
      .join(""));

    const experiencesHtml = raw(profile.experiences
      .map(
        (exp, idx) => html`
          <article class="experience-row ${idx % 2 === 0 ? "is-left" : "is-right"} animate-slide-up" style="animation-delay:${idx * 110}ms; animation-fill-mode: both;">
            <div class="experience-card experience-text rounded-2xl p-5 md:p-6">
              <h3 class="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">${exp.role}</h3>
              <p class="mt-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">${exp.startDate} - ${exp.endDate}</p>
              <p class="experience-company mt-2 text-sm md:text-base">${exp.company}</p>
              <div class="experience-stack mt-3">
                ${raw(exp.techStack.map((item) => `<span class="experience-chip">${item}</span>`).join(""))}
              </div>
            </div>
            <div class="experience-dot" aria-hidden="true"></div>
          </article>
        `,
      )
      .join(""));

    const projectsHtml = raw(profile.projects
      .map(
        (project, idx) => html`
          <article class="project-card p-5 md:p-6 animate-slide-up" data-project-card="true" data-category="${project.category}" style="animation-delay:${idx * 120}ms; animation-fill-mode: both;">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">${project.name}</h3>
              <span class="inline-flex rounded-full bg-[color:var(--bg-primary)] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-muted)]">${project.category}</span>
            </div>
            <p data-i18n-tr="${project.summary.tr}" data-i18n-en="${project.summary.en}" class="mt-3 text-sm md:text-base leading-7 text-[color:var(--text-secondary)]">${project.summary.tr}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              ${raw(project.stack.map((item) => `<span class="rounded-full bg-[color:var(--bg-primary)]/70 px-2.5 py-1 text-xs text-[color:var(--text-secondary)]">${item}</span>`).join(""))}
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <a href="${project.liveUrl}" target="_blank" rel="noreferrer" data-i18n-live="true" class="inline-flex items-center gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-primary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:text-[color:var(--accent)]">
                ${iconExternal}
                Live
              </a>
              <a href="${project.githubUrl}" target="_blank" rel="noreferrer" data-i18n-source="true" class="inline-flex items-center gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-primary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:text-[color:var(--accent)]">
                ${iconGithub}
                Source
              </a>
            </div>
          </article>
        `,
      )
      .join(""));

    const categoryLabels: Record<string, string> = {
      all: "Tümü",
      IDE: "IDE",
      "Database Engine": "Veritabanı Motoru",
      SaaS: "SaaS",
      B2B: "B2B",
    };

    const projectCategories = ["all", ...new Set(profile.projects.map((project) => project.category))];
    const projectTabsHtml = raw(projectCategories
      .map(
        (category, idx) =>
          `<button type="button" class="project-tab" data-category="${category}" data-active="${idx === 0 ? "true" : "false"}">${categoryLabels[category] ?? category}</button>`,
      )
      .join(""));

    const statsHtml = raw([
      { key: "stars", label: "Yıldız", value: profile.githubStats.stars, icon: iconStar },
      { key: "forks", label: "Fork", value: profile.githubStats.forks, icon: iconFork },
      { key: "commits", label: "Commit", value: profile.githubStats.commits, icon: iconCommit },
    ]
      .map(
        (stat) => `
          <div class="inline-flex w-full items-center justify-between gap-2 rounded-xl bg-[color:var(--bg-primary)] px-3 py-2 text-sm text-[color:var(--text-secondary)] shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
            <span class="inline-flex items-center gap-2">
              ${stat.icon.value}
              <span data-stat-label="${stat.key}" class="text-[color:var(--text-muted)]">${stat.label}</span>
            </span>
            <span class="text-[color:var(--text-primary)] font-semibold">${stat.value.toLocaleString("en-US")}</span>
          </div>
        `,
      )
      .join(""));

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
        <button id="theme-toggle" class="float-item" type="button" aria-label="Temayı değiştir" data-theme-toggle="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
          <span id="theme-label" class="hidden" data-theme-label="true">Dark</span>
        </button>
        <button id="locale-toggle" class="float-item" type="button" aria-label="Dili değiştir" data-locale-toggle="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
          <span id="locale-label" class="hidden" data-locale-label="true">TR</span>
        </button>
      </aside>

      <nav class="mobile-toolbar xl:hidden" aria-label="Hizli erisim">
        <div class="mobile-toolbar-scroll">
          <a href="#hero" class="mobile-toolbar-link" data-i18n-tr="Ana Sayfa" data-i18n-en="Home">Ana Sayfa</a>
          <a href="#about" class="mobile-toolbar-link" data-i18n-tr="Hakkımda" data-i18n-en="About">Hakkımda</a>
          <a href="#experience" class="mobile-toolbar-link" data-i18n-tr="Deneyim" data-i18n-en="Experience">Deneyim</a>
          <a href="#projects" class="mobile-toolbar-link" data-i18n-tr="Projeler" data-i18n-en="Projects">Projeler</a>
        </div>
        <div class="mobile-toolbar-actions">
          <button class="toolbar-toggle" type="button" aria-label="Temayi degistir" data-theme-toggle="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
            <span data-theme-label="true">Dark</span>
          </button>
          <button class="toolbar-toggle" type="button" aria-label="Dili degistir" data-locale-toggle="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
            <span data-locale-label="true">TR</span>
          </button>
        </div>
      </nav>

      <main class="animate-fade-in">
        <section id="hero" class="mx-auto max-w-5xl px-5 pt-6 pb-6 sm:px-8 md:pt-16">
          <div class="relative rounded-3xl border border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(217,119,87,0.14),_transparent_45%),linear-gradient(180deg,var(--bg-secondary)_0%,var(--bg-primary)_100%)] p-6 md:p-10 md:pr-72">
            <p id="hero-tags" class="text-xs leading-6 tracking-[0.22em] text-[color:var(--text-muted)]">fiyuu / denis / quark / plexus / locai</p>
            <h1 class="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-[color:var(--text-primary)]">${profile.fullName}</h1>
            <p id="hero-title" data-i18n-tr="${profile.title.tr}" data-i18n-en="${profile.title.en}" class="mt-3 text-base sm:text-lg md:text-xl text-[color:var(--accent)]">${profile.title.tr}</p>
            <p id="hero-location" data-i18n-tr="${profile.location.tr}" data-i18n-en="${profile.location.en}" class="mt-2 text-sm md:text-base text-[color:var(--text-muted)]">${profile.location.tr}</p>

            <div class="mt-6 flex flex-wrap gap-3">
              <a href="mailto:${profile.contacts.email}" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:w-auto sm:justify-start">
                ${iconMail}
                <span id="email-label">E-posta</span>
              </a>
              <a href="${profile.contacts.github}" target="_blank" rel="noreferrer" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:w-auto sm:justify-start">
                ${iconGithub}
                GitHub
              </a>
              <a href="${profile.contacts.linkedin}" target="_blank" rel="noreferrer" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:w-auto sm:justify-start">
                ${iconLinkedIn}
                LinkedIn
              </a>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:absolute md:bottom-8 md:right-8 md:mt-0 md:w-56 md:grid-cols-1">${statsHtml}</div>
          </div>
        </section>

        <section id="about" class="mx-auto max-w-5xl px-5 py-5 sm:px-8 md:py-7">
          <div class="space-y-4">
            <h2 id="heading-about" class="text-sm font-bold tracking-[0.18em] uppercase text-[color:var(--text-muted)] animate-slide-in-left">Hakkımda</h2>
            <div class="space-y-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)]/55 p-5 sm:p-6">${aboutHtml}</div>
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
      
      <footer class="flex w-full items-center justify-center gap-1 px-5 py-6 text-center text-sm text-[color:var(--text-muted)]">
        built with <a class="text-[color:var(--accent)]" href="https://fiyuu.work">fiyuu</a>
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
          const localeToggles = [...document.querySelectorAll("[data-locale-toggle='true']")];
          const localeLabels = [...document.querySelectorAll("[data-locale-label='true']")];

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

            localeLabels.forEach((label) => {
              label.textContent = dict.locale;
            });
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

          localeToggles.forEach((toggle) => {
            toggle.addEventListener("click", () => {
              const current = localStorage.getItem(localeStorageKey) === "en" ? "en" : "tr";
              const next = current === "tr" ? "en" : "tr";
              applyLocale(next);
            });
          });

          applyLocale(localStorage.getItem(localeStorageKey) === "en" ? "en" : "tr");
          applyCategory("all");
        })();
      </script>
    `;
  }
}
