import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type AuthData = {
  users: Array<{ id: string; username: string; role: string }>;
  sessions: Array<{ id: string; userId: string; status: string }>;
  hint: { username: string; password: string };
};

export const page = definePage({
  intent: "Auth page demonstrating F1-backed users and sessions",
});

export default class Page extends Component<PageProps<AuthData>> {
  template({ data }: PageProps<AuthData> = this.props) {
    const usersHtml = (data?.users ?? [])
      .map((user) => html`<div class="rounded-2xl border border-[#7a8f6b]/10 px-4 py-4 text-sm"><div class="font-medium text-[#24311f]">${escapeHtml(user.username)}</div><div class="mt-1 text-[#61705b]">${escapeHtml(user.role)} · ${escapeHtml(user.id)}</div></div>`)
      .join("");
    const sessionsHtml = (data?.sessions ?? [])
      .map((session) => html`<div class="rounded-2xl border border-white/10 px-4 py-4 text-sm"><div class="font-medium">${escapeHtml(session.id)}</div><div class="mt-1 text-[#dbe5d4]">${escapeHtml(session.userId)} · ${escapeHtml(session.status)}</div></div>`)
      .join("");
    const script = "const form=document.getElementById('fiyuu-auth-form');const username=document.getElementById('fiyuu-auth-username');const password=document.getElementById('fiyuu-auth-password');const result=document.getElementById('fiyuu-auth-result');const submit=document.getElementById('fiyuu-auth-submit');form&&form.addEventListener('submit',async(event)=>{event.preventDefault();if(!username||!password||!result||!submit)return;submit.setAttribute('disabled','true');result.textContent='Signing in...';const response=await fetch('/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:username.value,password:password.value})});const payload=await response.json();result.textContent=payload.message||'Finished';submit.removeAttribute('disabled');if(payload.success){location.reload();}});";

    return html`
      <main class="min-h-screen w-full bg-[#f7f3ea] px-6 py-12 text-[#31402b]">
        <div class="w-full rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Auth Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">F1-backed Auth Starter</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route shows how user and session records can live in the F1 store while your UI stays inside the same deterministic feature structure.</p>
          <div class="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section class="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6"><h2 class="text-lg font-semibold text-[#24311f]">Sign in</h2><p class="mt-2 text-sm text-[#61705b]">Use the default starter account to test a working username/password flow.</p><div class="mt-4 rounded-2xl bg-[#eef4e8] px-4 py-4 text-sm text-[#44513f]">username: <strong>${escapeHtml(data?.hint.username ?? "founder")}</strong><br/>password: <strong>${escapeHtml(data?.hint.password ?? "fiyuu123")}</strong></div><form id="fiyuu-auth-form" class="mt-5 space-y-3"><input id="fiyuu-auth-username" name="username" value="${escapeHtml(data?.hint.username ?? "founder")}" placeholder="Username" class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none"/><input id="fiyuu-auth-password" name="password" value="${escapeHtml(data?.hint.password ?? "fiyuu123")}" type="password" placeholder="Password" class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none"/><button id="fiyuu-auth-submit" type="submit" class="rounded-2xl bg-[#31402b] px-5 py-3 text-sm font-medium text-[#f7f3ea]">Sign in</button></form><div id="fiyuu-auth-result" class="mt-4 text-sm text-[#55654e]"></div></section>
            <section class="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6"><h2 class="text-lg font-semibold text-[#24311f]">Users</h2><div class="mt-4 space-y-3">${usersHtml}</div></section>
            <section class="rounded-3xl bg-[#31402b] p-6 text-[#f7f3ea]"><h2 class="text-lg font-semibold">Sessions</h2><div class="mt-4 space-y-3">${sessionsHtml}</div></section>
          </div>
        </div>
      </main>
      <script type="module">${script}</script>
    `;
  }
}
