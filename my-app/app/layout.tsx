import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps } from "fiyuu/client";

export const layout = defineLayout({
  name: "root",
});

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    const script = "const root=document.documentElement;const themeButton=document.getElementById('theme-toggle');const authButton=document.getElementById('auth-open');const authModal=document.getElementById('auth-modal');const authClose=document.getElementById('auth-close');const authTitle=document.getElementById('auth-title');const authNameWrap=document.getElementById('auth-name-wrap');const authForm=document.getElementById('auth-form');const authName=document.getElementById('auth-name');const authEmail=document.getElementById('auth-email');const authPassword=document.getElementById('auth-password');const authMessage=document.getElementById('auth-message');const modeSignIn=document.getElementById('auth-mode-signin');const modeSignUp=document.getElementById('auth-mode-signup');const authLabel=document.getElementById('auth-label');const authRole=document.getElementById('auth-role');const logoutButton=document.getElementById('auth-logout');const sessionLinks=document.querySelectorAll('[data-session-link]');let mode='sign-in';const setMode=(next)=>{mode=next;if(authTitle){authTitle.textContent=mode==='sign-in'?'Sign in':'Sign up';}if(authNameWrap){authNameWrap.style.display=mode==='sign-up'?'block':'none';}if(modeSignIn){modeSignIn.style.background=mode==='sign-in'?'rgba(255,255,255,.08)':'transparent';}if(modeSignUp){modeSignUp.style.background=mode==='sign-up'?'rgba(255,255,255,.08)':'transparent';}};const applyTheme=()=>{const saved=localStorage.getItem('fiyuu-theme')||'light';root.classList.toggle('dark',saved==='dark');if(themeButton){themeButton.textContent=root.classList.contains('dark')?'Light':'Dark';}};const updateAuthState=()=>{const sessionId=localStorage.getItem('fiyuu-session-id')||'';const userRaw=localStorage.getItem('fiyuu-user')||'';let user=null;try{user=userRaw?JSON.parse(userRaw):null;}catch{}if(authLabel){authLabel.textContent=user&&user.name?user.name:'Guest';}if(authRole){authRole.textContent=user&&user.role?user.role:'not signed in';}if(authButton){authButton.textContent=user?'Account':'Sign in';}for(const node of sessionLinks){const href=node.getAttribute('href')||'/';const clean=href.split('?')[0];if(sessionId){node.setAttribute('href',clean+'?sessionId='+encodeURIComponent(sessionId));}else{node.setAttribute('href',clean);}}};applyTheme();updateAuthState();setMode('sign-in');themeButton&&themeButton.addEventListener('click',()=>{const next=root.classList.contains('dark')?'light':'dark';localStorage.setItem('fiyuu-theme',next);applyTheme();});authButton&&authButton.addEventListener('click',()=>{if(authModal){authModal.style.display='flex';}});authClose&&authClose.addEventListener('click',()=>{if(authModal){authModal.style.display='none';}});authModal&&authModal.addEventListener('click',(event)=>{if(event.target===authModal){authModal.style.display='none';}});modeSignIn&&modeSignIn.addEventListener('click',()=>setMode('sign-in'));modeSignUp&&modeSignUp.addEventListener('click',()=>setMode('sign-up'));authForm&&authForm.addEventListener('submit',async(event)=>{event.preventDefault();if(!authEmail||!authPassword||!authMessage)return;const payload={intent:mode,name:authName?authName.value:'',email:authEmail.value,password:authPassword.value};authMessage.textContent='Processing...';const response=await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const json=await response.json();authMessage.textContent=json.message||'Done';if(json.success&&json.sessionId){localStorage.setItem('fiyuu-session-id',json.sessionId);if(json.user){localStorage.setItem('fiyuu-user',JSON.stringify(json.user));}updateAuthState();if(authModal){authModal.style.display='none';}location.reload();}});logoutButton&&logoutButton.addEventListener('click',()=>{localStorage.removeItem('fiyuu-session-id');localStorage.removeItem('fiyuu-user');updateAuthState();location.href='/';});";

    return html`
      <div class="min-h-screen bg-[#f7f3ea] text-[#33412f] dark:bg-[#111513] dark:text-[#e8f1ea]">
        <header class="border-b border-[#7a8f6b]/20 bg-[#f8f4ec]/90 dark:border-[#42604d]/35 dark:bg-[#1b241f]/95">
          <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <a href="/" class="text-xl font-semibold">Fiyuu Blog</a>
            <nav class="flex flex-wrap items-center gap-2 text-sm">
              <a href="/" class="rounded-full px-3 py-1 hover:bg-[#eaf0e5] dark:hover:bg-[#24312a]">Home</a>
              <a href="/blog" data-session-link="true" class="rounded-full px-3 py-1 hover:bg-[#eaf0e5] dark:hover:bg-[#24312a]">Blog</a>
              <a href="/profile" data-session-link="true" class="rounded-full px-3 py-1 hover:bg-[#eaf0e5] dark:hover:bg-[#24312a]">Profile</a>
              <a href="/admin" data-session-link="true" class="rounded-full px-3 py-1 hover:bg-[#eaf0e5] dark:hover:bg-[#24312a]">Admin</a>
              <button id="auth-open" type="button" class="rounded-full border border-[#7a8f6b]/25 px-3 py-1">Sign in</button>
              <button id="theme-toggle" type="button" class="rounded-full border border-[#7a8f6b]/25 px-3 py-1">Dark</button>
              <span id="auth-label" class="rounded-full bg-[#eef3e8] px-3 py-1 text-xs dark:bg-[#2a382f]">Guest</span>
            </nav>
          </div>
        </header>

        <main>${children ?? ""}</main>

        <footer class="border-t border-[#7a8f6b]/20 bg-[#f8f4ec]/90 dark:border-[#42604d]/35 dark:bg-[#1b241f]/95">
          <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-sm text-[#5b6a54] dark:text-[#b8c8bc] sm:px-6">
            <p>Fiyuu Blog · F1 database enabled</p>
            <p id="auth-role">not signed in</p>
          </div>
        </footer>
      </div>

      <div id="auth-modal" style="display:none" class="fixed inset-0 z-[12000] items-center justify-center bg-black/45 px-4">
        <div class="w-full max-w-md rounded-3xl border border-white/15 bg-[#1a231e] p-5 text-[#f2f7f1] shadow-2xl">
          <div class="flex items-center justify-between">
            <h2 id="auth-title" class="text-xl font-semibold">Sign in</h2>
            <button id="auth-close" type="button" class="rounded-full border border-white/20 px-2 py-1 text-xs">Close</button>
          </div>
          <div class="mt-3 flex gap-2 text-xs">
            <button id="auth-mode-signin" type="button" class="rounded-full border border-white/20 px-3 py-1">Sign in</button>
            <button id="auth-mode-signup" type="button" class="rounded-full border border-white/20 px-3 py-1">Sign up</button>
          </div>
          <form id="auth-form" class="mt-4 space-y-3">
            <div id="auth-name-wrap" style="display:none">
              <input id="auth-name" placeholder="Full name" class="w-full rounded-2xl border border-white/20 bg-[#101612] px-4 py-3 text-sm" />
            </div>
            <input id="auth-email" type="email" required placeholder="Email" class="w-full rounded-2xl border border-white/20 bg-[#101612] px-4 py-3 text-sm" />
            <input id="auth-password" type="password" required placeholder="Password" class="w-full rounded-2xl border border-white/20 bg-[#101612] px-4 py-3 text-sm" />
            <button type="submit" class="rounded-full bg-[#385241] px-5 py-2 text-sm">Continue</button>
          </form>
          <p id="auth-message" class="mt-3 text-sm text-[#bfd1c2]"></p>
          <button id="auth-logout" type="button" class="mt-3 rounded-full border border-[#ad6c6c]/35 px-4 py-1 text-xs text-[#f2c5c5]">Sign out</button>
          <p class="mt-4 text-xs text-[#a7b8ab]">Admin seed: admin@fiyuu.dev / admin123</p>
        </div>
      </div>

      <script type="module">${script}</script>
    `;
  }
}
