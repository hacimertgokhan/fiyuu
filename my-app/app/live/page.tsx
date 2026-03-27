import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type LiveData = {
  initialCount: number;
  channel: string;
};

export const page = definePage({
  intent: "Live counter page demonstrating websocket updates",
});

export default class Page extends Component<PageProps<LiveData>> {
  template({ data }: PageProps<LiveData> = this.props) {
    const script = "const count=document.getElementById('fiyuu-live-count');const status=document.getElementById('fiyuu-live-status');const protocol=location.protocol==='https:'?'wss':'ws';const path='__FIYUU_WS_PATH__'.replace('__FIYUU_WS_PATH__','/__fiyuu/ws');const socket=new WebSocket(protocol+'://'+location.host+path);const fail=()=>{if(status)status.textContent='unavailable';};const timeout=setTimeout(fail,3500);socket.addEventListener('open',()=>{clearTimeout(timeout);if(status)status.textContent='connected';});socket.addEventListener('error',()=>{clearTimeout(timeout);fail();});socket.addEventListener('close',()=>{if(status&&status.textContent!=='unavailable')status.textContent='closed';});socket.addEventListener('message',(event)=>{try{const payload=JSON.parse(event.data);if(payload&&payload.type==='counter:tick'&&typeof payload.count==='number'&&count){count.textContent=String(payload.count);}}catch{if(status)status.textContent='message-error';}});";
    return html`
      <main class="min-h-screen w-full px-6 py-12 text-[#31402b]">
        <div class="w-full rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Realtime Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">Live Counter</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route listens to the starter websocket server and updates a counter in real time.</p>
          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="rounded-3xl bg-[#31402b] p-8 text-[#f7f3ea]"><div class="text-xs uppercase tracking-[0.2em] text-[#cdd7c6]">Channel</div><div class="mt-3 text-3xl font-semibold">${escapeHtml(data?.channel ?? "updates")}</div></div>
            <div class="rounded-3xl border border-[#7a8f6b]/20 bg-[#fcfaf5] p-8"><div class="text-xs uppercase tracking-[0.2em] text-[#7a8b71]">Live Count</div><div id="fiyuu-live-count" class="mt-3 text-5xl font-semibold text-[#24311f]">${String(data?.initialCount ?? 0)}</div><div class="mt-3 text-sm text-[#61705b]">Socket status: <span id="fiyuu-live-status">connecting</span></div></div>
          </div>
        </div>
      </main>
      <script type="module">${script}</script>
    `;
  }
}
