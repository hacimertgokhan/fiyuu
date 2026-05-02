import { definePage, html, raw } from "@fiyuu/core";

// ─── Icons ──────────────────────────────────────────────────────────
const icon = (d: string) => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`);

const Icons = {
  mail: icon("m4 6 8 6 8-6"),
  github: icon("M9 19c-4 1.5-4-2.5-6-3m12 6v-3.9a3.3 3.3 0 0 0-.9-2.5c3-.4 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19 5.3 4.8 4.8 0 0 0 18.9 2S17.7 1.6 15 3.4a13.3 13.3 0 0 0-6 0C6.3 1.6 5.1 2 5.1 2a4.8 4.8 0 0 0-.1 3.3A5.2 5.2 0 0 0 3.7 8.9c0 5.2 3.2 6.3 6.2 6.7a3.3 3.3 0 0 0-.9 2.5V22"),
  linkedin: icon("M8 11v6m0-9v.01M12 17v-3a2 2 0 1 1 4 0v3"),
  external: icon("M14 5h5v5m-9 9h9V10M5 14V5h9"),
  star: icon("m12 3.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.6l-5.6 2.9 1.1-6.1L3 10.1l6.2-.9z"),
  fork: icon("M6 6h0m12 0h0m-6 12h0M8.2 7.2 10.7 15M15.8 7.2 13.3 15"),
  commit: icon("M12 12h0M3 12h5m8 0h5"),
  home: icon("M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"),
  user: icon("M12 8h0M5 20a7 7 0 0 1 14 0"),
  calendar: icon("M16 3v4M8 3v4M3 11h18"),
  folder: icon("M8 20h8"),
  globe: icon("M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"),
};

// ─── i18n ───────────────────────────────────────────────────────────
const i18n = {
  tr: {
    email: "E-posta", about: "Hakkımda", experience: "Tecrübelerim", projects: "Projelerim",
    live: "Canlı", source: "Kaynak", navHero: "Ana bölüm", navAbout: "Hakkımda",
    navExperience: "Tecrübelerim", navProjects: "Projelerim",
    stats: { stars: "Yıldız", forks: "Fork", commits: "Commit" },
    categories: { all: "Tümü", IDE: "IDE", "Database Engine": "Veritabanı Motoru", SaaS: "SaaS", B2B: "B2B" },
    locale: "TR", builtWith: "ile geliştirildi",
  },
  en: {
    email: "Email", about: "About", experience: "Experience", projects: "Projects",
    live: "Live", source: "Source", navHero: "Home", navAbout: "About",
    navExperience: "Experience", navProjects: "Projects",
    stats: { stars: "Stars", forks: "Forks", commits: "Commits" },
    categories: { all: "All", IDE: "IDE", "Database Engine": "Data & Engine", SaaS: "SaaS", B2B: "B2B" },
    locale: "EN", builtWith: "built with",
  },
};

// ─── Nav ────────────────────────────────────────────────────────────
function renderNav() {
  return html`
    <aside id="floatbar" class="floating-nav hidden xl:flex">
      <a href="#hero" class="float-item" data-target="hero" data-active="true" aria-label="Ana bölüm">${Icons.home}</a>
      <a href="#about" class="float-item" data-target="about" data-active="false" aria-label="Hakkımda">${Icons.user}</a>
      <a href="#experience" class="float-item" data-target="experience" data-active="false" aria-label="Tecrübelerim">${Icons.calendar}</a>
      <a href="#projects" class="float-item" data-target="projects" data-active="false" aria-label="Projelerim">${Icons.folder}</a>
      <button class="float-item" type="button" data-locale-toggle="true" aria-label="Dili değiştir">${Icons.globe}</button>
    </aside>
    <nav class="mobile-toolbar xl:hidden" aria-label="Hizli erisim">
      <div class="mobile-toolbar-scroll">
        <a href="#hero" class="mobile-toolbar-link">Ana Sayfa</a>
        <a href="#about" class="mobile-toolbar-link">Hakkımda</a>
        <a href="#experience" class="mobile-toolbar-link">Deneyim</a>
        <a href="#projects" class="mobile-toolbar-link">Projeler</a>
      </div>
      <div class="mobile-toolbar-actions">
        <button class="toolbar-toggle" type="button" data-locale-toggle="true">${Icons.globe}<span data-locale-label="true">TR</span></button>
      </div>
    </nav>
  `;
}

// ─── Hero ───────────────────────────────────────────────────────────
function renderHero(profile) {
  const stats = [
    { key: "stars", label: "Yıldız", value: profile.githubStats.stars, icon: Icons.star },
    { key: "forks", label: "Fork", value: profile.githubStats.forks, icon: Icons.fork },
    { key: "commits", label: "Commit", value: profile.githubStats.commits, icon: Icons.commit },
  ];

  const statsHtml = raw(stats.map(s => `
    <div class="stat-item">
      <span class="inline-flex items-center gap-2 text-[color:var(--text-muted)]">${s.icon.value}<span data-stat-label="${s.key}">${s.label}</span></span>
      <span class="font-semibold">${s.value.toLocaleString("en-US")}</span>
    </div>`).join(""));

  return html`
    <section id="hero" class="section-container pt-6 pb-6 md:pt-16">
      <div class="hero-section p-6 md:p-10 md:pr-72">
        <p class="text-xs leading-6 tracking-[0.22em] text-[color:var(--text-muted)]">fiyuu / denis / quark / plexus / locai</p>
        <h1 class="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight">${profile.fullName}</h1>
        <p data-i18n-tr="${profile.title.tr}" data-i18n-en="${profile.title.en}" class="mt-3 text-base sm:text-lg md:text-xl text-gradient font-medium">${profile.title.tr}</p>
        <p data-i18n-tr="${profile.location.tr}" data-i18n-en="${profile.location.en}" class="mt-2 text-sm md:text-base text-[color:var(--text-muted)]">${profile.location.tr}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a href="mailto:${profile.contacts.email}" class="btn-icon w-full sm:w-auto">${Icons.mail}<span id="email-label">E-posta</span></a>
          <a href="${profile.contacts.github}" target="_blank" rel="noreferrer" class="btn-icon w-full sm:w-auto">${Icons.github}GitHub</a>
          <a href="${profile.contacts.linkedin}" target="_blank" rel="noreferrer" class="btn-icon w-full sm:w-auto">${Icons.linkedin}LinkedIn</a>
        </div>
        <div class="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:absolute md:bottom-8 md:right-8 md:mt-0 md:w-56 md:grid-cols-1">${statsHtml}</div>
      </div>
    </section>
  `;
}

// ─── About ──────────────────────────────────────────────────────────
function renderAbout(profile) {
  const paragraphsHtml = raw(profile.about.tr.map((p, i) => `
    <p data-i18n-tr="${p}" data-i18n-en="${profile.about.en[i] ?? p}" class="text-base md:text-lg leading-8 text-[color:var(--text-secondary)]">${p}</p>`).join(""));

  return html`
    <section id="about" class="section-container py-5 md:py-7">
      <div class="space-y-4">
        <h2 id="heading-about" class="section-title animate-slide-in-left">Hakkımda</h2>
        <div class="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)] p-5 sm:p-6">${paragraphsHtml}</div>
      </div>
    </section>
  `;
}

// ─── Experience ─────────────────────────────────────────────────────
function renderExperience(profile) {
  const itemsHtml = raw(profile.experiences.map((exp, idx) => `
    <article class="experience-item animate-slide-up" style="animation-delay:${idx*100}ms;animation-fill-mode:both;">
      <div class="experience-dot" aria-hidden="true"></div>
      <div class="experience-content">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h3 class="text-lg md:text-xl font-bold">${exp.role}</h3>
          <span class="text-xs uppercase tracking-[0.15em] text-[color:var(--text-muted)]">${exp.startDate} - ${exp.endDate}</span>
        </div>
        <p class="mt-1 text-sm text-[color:var(--text-secondary)]">${exp.company}</p>
        <div class="mt-3 flex flex-wrap gap-2">${exp.techStack.map(t => `<span class="chip">${t}</span>`).join("")}</div>
      </div>
    </article>`).join(""));

  return html`
    <section id="experience" class="section-container pb-8 pt-4 md:pb-10 md:pt-5">
      <div class="space-y-4 mt-12">
        <h2 id="heading-experience" class="section-title animate-slide-in-left">Tecrübelerim</h2>
        <div class="experience-timeline">${itemsHtml}</div>
      </div>
    </section>
  `;
}

// ─── Projects ───────────────────────────────────────────────────────
const categoryLabels = {
  all: "Tümü", IDE: "IDE", "Database Engine": "Veritabanı Motoru", SaaS: "SaaS", B2B: "B2B"
};

function renderProjects(profile) {
  const categories = ["all", ...new Set(profile.projects.map(p => p.category))];
  const tabsHtml = raw(categories.map((c, i) => `
    <button type="button" class="project-tab" data-category="${c}" data-active="${i===0?"true":"false"}">${categoryLabels[c] ?? c}</button>`).join(""));

  const projectsHtml = raw(profile.projects.map((p, idx) => `
    <article class="card accent-border-top animate-slide-up" data-project-card="true" data-category="${p.category}" style="animation-delay:${idx*100}ms;animation-fill-mode:both;">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg md:text-xl font-bold">${p.name}</h3>
        <span class="chip-accent">${p.category}</span>
      </div>
      <p data-i18n-tr="${p.summary.tr}" data-i18n-en="${p.summary.en}" class="mt-3 text-sm md:text-base leading-7 text-[color:var(--text-secondary)]">${p.summary.tr}</p>
      <div class="mt-4 flex flex-wrap gap-2">${p.stack.map(s => `<span class="chip">${s}</span>`).join("")}</div>
      <div class="mt-5 flex flex-wrap gap-3">
        <a href="${p.liveUrl}" target="_blank" rel="noreferrer" data-i18n-live="true" class="btn-icon">${Icons.external.value}<span>Canlı</span></a>
        <a href="${p.githubUrl}" target="_blank" rel="noreferrer" data-i18n-source="true" class="btn-icon">${Icons.github.value}<span>Kaynak</span></a>
      </div>
    </article>`).join(""));

  return html`
    <section id="projects" class="section-container pb-12 md:pb-14">
      <div class="space-y-4 mt-12">
        <h2 id="heading-projects" class="section-title animate-slide-in-left">Projelerim</h2>
        <div class="project-tabs">${tabsHtml}</div>
        <div class="projects-stage">
          <div id="projects-grid" class="grid gap-5 md:grid-cols-2">${projectsHtml}</div>
        </div>
        <div id="project-pagination" class="project-pagination" aria-label="Proje sayfalama"></div>
      </div>
    </section>
  `;
}

// ─── Footer ─────────────────────────────────────────────────────────
function renderFooter() {
  return html`
    <footer class="flex w-full items-center justify-center gap-1 px-5 py-8 text-center text-sm text-[color:var(--text-muted)]">
      <span data-i18n-built="true"></span><a class="link-hover" href="https://fiyuu.work">fiyuu</a>
    </footer>
  `;
}

// ─── Main Page ──────────────────────────────────────────────────────
export default definePage({
  render: ({ data }) => {
    const profile = data as any;

    return html`
      ${raw(renderNav())}
      <main>
        ${raw(renderHero(profile))}
        ${raw(renderAbout(profile))}
        ${raw(renderExperience(profile))}
        ${raw(renderProjects(profile))}
      </main>
      ${raw(renderFooter())}

      <script type="module">
        (() => {
          const i18n = {
            tr: {
              email: "E-posta", about: "Hakkımda", experience: "Tecrübelerim", projects: "Projelerim",
              live: "Canlı", source: "Kaynak", navHero: "Ana bölüm", navAbout: "Hakkımda",
              navExperience: "Tecrübelerim", navProjects: "Projelerim",
              stats: { stars: "Yıldız", forks: "Fork", commits: "Commit" },
              categories: { all: "Tümü", IDE: "IDE", "Database Engine": "Veritabanı Motoru", SaaS: "SaaS", B2B: "B2B" },
              locale: "TR", builtWith: "ile geliştirildi",
            },
            en: {
              email: "Email", about: "About", experience: "Experience", projects: "Projects",
              live: "Live", source: "Source", navHero: "Home", navAbout: "About",
              navExperience: "Experience", navProjects: "Projects",
              stats: { stars: "Stars", forks: "Forks", commits: "Commits" },
              categories: { all: "All", IDE: "IDE", "Database Engine": "Data & Engine", SaaS: "SaaS", B2B: "B2B" },
              locale: "EN", builtWith: "built with",
            },
          };

          const navItems = [...document.querySelectorAll(".float-item[data-target]")];
          const sections = navItems.map(i => document.getElementById(i.getAttribute("data-target")||"")).filter(Boolean);
          const updateActive = () => {
            const y = window.innerHeight * 0.45;
            let activeId = sections[0]?.id || "hero";
            for (const s of sections) {
              const r = s.getBoundingClientRect();
              if (r.top <= y && r.bottom > y) { activeId = s.id; break; }
            }
            const bottom = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            if (window.scrollY + window.innerHeight >= bottom - 4 && sections.length) activeId = sections[sections.length-1].id;
            navItems.forEach(i => i.setAttribute("data-active", i.getAttribute("data-target") === activeId ? "true" : "false"));
          };
          if (navItems.length && sections.length) {
            window.addEventListener("scroll", updateActive, { passive: true });
            updateActive();
          }

          const localeKey = "portfolio-locale";
          const applyLocale = (locale) => {
            const d = i18n[locale] || i18n.tr;
            document.documentElement.lang = locale;
            const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            set("email-label", d.email);
            set("heading-about", d.about);
            set("heading-experience", d.experience);
            set("heading-projects", d.projects);
            document.getElementById("nav-hero")?.setAttribute("aria-label", d.navHero);
            document.getElementById("nav-about")?.setAttribute("aria-label", d.navAbout);
            document.getElementById("nav-experience")?.setAttribute("aria-label", d.navExperience);
            document.getElementById("nav-projects")?.setAttribute("aria-label", d.navProjects);
            document.querySelectorAll("[data-stat-label]").forEach(el => {
              el.textContent = d.stats[el.getAttribute("data-stat-label")] || "";
            });
            document.querySelectorAll("[data-i18n-tr][data-i18n-en]").forEach(el => {
              const text = locale === "en" ? el.getAttribute("data-i18n-en") : el.getAttribute("data-i18n-tr");
              if (text) el.textContent = text;
            });
            document.querySelectorAll("[data-i18n-live='true'] span").forEach(el => el.textContent = d.live);
            document.querySelectorAll("[data-i18n-source='true'] span").forEach(el => el.textContent = d.source);
            document.querySelectorAll(".project-tab").forEach(tab => {
              const key = tab.getAttribute("data-category");
              tab.textContent = d.categories[key] || key;
            });
            document.querySelectorAll("[data-locale-label='true']").forEach(el => el.textContent = d.locale);
            document.querySelectorAll("[data-i18n-built='true']").forEach(el => el.textContent = d.builtWith + " ");
            localStorage.setItem(localeKey, locale);
          };

          const pageSize = 4;
          let currentCategory = "all";
          let currentPage = 1;
          const pagination = document.getElementById("project-pagination");

          const getMatchingCards = () => [...document.querySelectorAll("[data-project-card='true']")]
            .filter(card => currentCategory === "all" || card.getAttribute("data-category") === currentCategory);

          const renderProjectPage = () => {
            const cards = [...document.querySelectorAll("[data-project-card='true']")];
            const matchingCards = getMatchingCards();
            const pageCount = Math.max(1, Math.ceil(matchingCards.length / pageSize));
            currentPage = Math.min(currentPage, pageCount);

            cards.forEach(card => {
              card.style.display = "none";
            });

            const start = (currentPage - 1) * pageSize;
            matchingCards.slice(start, start + pageSize).forEach(card => {
              card.style.display = "";
            });

            if (!pagination) return;
            pagination.innerHTML = "";
            pagination.style.display = pageCount > 1 ? "flex" : "none";

            for (let page = 1; page <= pageCount; page += 1) {
              const button = document.createElement("button");
              button.type = "button";
              button.className = "project-page-button";
              button.textContent = String(page);
              button.setAttribute("data-active", page === currentPage ? "true" : "false");
              button.setAttribute("aria-label", "Proje sayfası " + page);
              button.addEventListener("click", () => {
                currentPage = page;
                renderProjectPage();
                document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
              pagination.appendChild(button);
            }
          };

          const applyCategory = (cat) => {
            currentCategory = cat;
            currentPage = 1;
            document.querySelectorAll(".project-tab").forEach(t => t.setAttribute("data-active", t.getAttribute("data-category") === cat ? "true" : "false"));
            renderProjectPage();
          };

          document.querySelectorAll(".project-tab").forEach(t => t.addEventListener("click", () => applyCategory(t.getAttribute("data-category") || "all")));
          document.querySelectorAll("[data-locale-toggle='true']").forEach(t => t.addEventListener("click", () => {
            const cur = localStorage.getItem(localeKey) === "en" ? "en" : "tr";
            applyLocale(cur === "tr" ? "en" : "tr");
          }));

          applyLocale(localStorage.getItem(localeKey) === "en" ? "en" : "tr");
          applyCategory("all");
        })();
      </script>
    `;
  },
});
