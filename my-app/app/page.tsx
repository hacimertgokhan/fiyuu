import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type HomeData = {
  stats: Array<{
    label: string;
    value: string;
  }>;
  skills: string[];
};

export const page = definePage({
  intent: "Minimal one-page home route for a focused Fiyuu starter",
});

export default class Page extends Component<PageProps<HomeData>> {
  template({ data }: PageProps<HomeData> = this.props) {
    const statsHtml = (data?.stats ?? [])
      .map(
        (item) => html`<div class="rounded-xl border border-[#7a8f6b]/18 bg-[#fcfaf5] px-4 py-3"><p class="text-[11px] uppercase tracking-[0.2em] text-[#708067]">${escapeHtml(item.label)}</p><p class="mt-1 text-2xl font-semibold text-[#263320]">${escapeHtml(item.value)}</p></div>`,
      )
      .join("");
    const skillsHtml = (data?.skills ?? [])
      .map((skill) => html`<span class="rounded-full border border-[#7a8f6b]/20 px-3 py-1 text-xs text-[#44513f]">${escapeHtml(skill)}</span>`)
      .join("");
    const explainHtml = [
      { title: "Single structure", body: "Routes, queries, actions, and metadata live in predictable folders." },
      { title: "AI-readable", body: "Project docs and contracts stay explicit so assistants can reason safely." },
      { title: "Gea-first runtime", body: "Rendering is optimized for Gea components with deterministic behavior." },
    ]
      .map((item) => html`<article class="rounded-xl border border-[#7a8f6b]/16 bg-[#fcfaf5] px-4 py-4"><h2 class="text-sm font-semibold text-[#24311f]">${item.title}</h2><p class="mt-2 text-sm leading-6 text-[#5c6955]">${item.body}</p></article>`)
      .join("");
    return html`
      <main class="min-h-screen bg-[linear-gradient(180deg,#f7f3ea_0%,#f1ebde_58%,#e9e0d0_100%)] px-4 py-4 text-[#33412f] dark:bg-[linear-gradient(180deg,#121614_0%,#171f1a_100%)] dark:text-[#e6efe8] sm:px-6 sm:py-5">
        <section class="flex min-h-[calc(100vh-2rem)] w-full flex-col justify-between rounded-[1.5rem] border border-[#7a8f6b]/20 bg-[#f8f4ec]/80 p-5 dark:border-[#4f6756]/35 dark:bg-[#1b241f]/90 sm:min-h-[calc(100vh-2.5rem)] sm:p-7">
          <nav class="flex items-center justify-between"><p class="text-xs uppercase tracking-[0.22em] text-[#627356] dark:text-[#95b39d]">Fiyuu starter</p><button id="fiyuu-theme-toggle" type="button" class="rounded-full border border-[#7a8f6b]/20 px-3 py-1 text-xs text-[#43523f] dark:border-[#6f8d77]/30 dark:text-[#d1e3d6]">Dark</button></nav>
          <header>
            <h1 class="mt-3 text-4xl font-semibold tracking-tight text-[#24311f] dark:text-[#ecf5ef] sm:text-5xl lg:text-6xl">Fiyuu is a structured fullstack framework for humans and AI.</h1>
            <p class="mt-4 max-w-4xl text-base leading-7 text-[#56654e] dark:text-[#b9cabc] sm:text-lg">It keeps route UI, server logic, and metadata in one deterministic layout so teams ship faster without losing clarity.</p>
          </header>
          <div class="mt-5 grid gap-3 lg:grid-cols-3">${explainHtml}</div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">${statsHtml}</div>
          <footer class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#7a8f6b]/15 pt-4">
            <p class="text-sm text-[#5f6d58] dark:text-[#acc1b1]">AI-first fullstack framework structure with deterministic routing.</p>
            <div class="flex flex-wrap gap-2">${skillsHtml}</div>
          </footer>
        </section>
      </main>
      <script type="module">const root=document.documentElement;const button=document.getElementById('fiyuu-theme-toggle');const saved=localStorage.getItem('fiyuu-theme');const initial=saved||'light';if(initial==='dark'){root.classList.add('dark');}if(button){button.textContent=root.classList.contains('dark')?'Light':'Dark';button.addEventListener('click',()=>{const next=root.classList.contains('dark')?'light':'dark';root.classList.toggle('dark',next==='dark');localStorage.setItem('fiyuu-theme',next);button.textContent=next==='dark'?'Light':'Dark';});}</script>
    `;
  }
}
