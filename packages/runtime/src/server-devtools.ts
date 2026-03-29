/**
 * Dev-only browser script generators for the Fiyuu runtime.
 * These return inline <script> strings injected into the rendered document.
 */

import type { RenderMode } from "@fiyuu/core";

export function renderInsightsPanelScript(): string {
  return `<script type="module">
const host=document.createElement('div');
host.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9998;font:12px/1.5 ui-monospace,monospace';
const toggle=document.createElement('button');
toggle.textContent='Fiyuu Insights';
toggle.style.cssText='border:1px solid rgba(197,214,181,.18);background:rgba(18,24,19,.94);color:#f8f3ea;border-radius:999px;padding:10px 14px;box-shadow:0 18px 56px rgba(0,0,0,.22);cursor:pointer';
const panel=document.createElement('aside');
panel.style.cssText='display:none;margin-top:10px;width:min(420px,calc(100vw - 30px));max-height:min(72vh,620px);overflow:auto;background:rgba(18,24,19,.96);color:#f8f3ea;border:1px solid rgba(197,214,181,.16);border-radius:18px;padding:14px 16px;box-shadow:0 18px 56px rgba(0,0,0,.22);backdrop-filter:blur(14px)';
toggle.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none';});

function renderItems(items){
  if(!items.length){return '<li style="margin-top:6px">No findings.</li>'}
  return items.slice(0,8).map((item)=>'<li style="margin-top:8px"><strong>['+item.severity.toUpperCase()+'] '+item.title+'</strong><br/><span style="opacity:.82">'+item.summary+'</span><br/><span style="opacity:.7">'+item.recommendation+'</span></li>').join('');
}

async function mount(){
  const response=await fetch('/__fiyuu/insights');
  const data=await response.json();
  const byCategory={
    security:(data.items||[]).filter((item)=>item.category==='security'),
    performance:(data.items||[]).filter((item)=>item.category==='performance'),
    design:(data.items||[]).filter((item)=>item.category==='design'),
    architecture:(data.items||[]).filter((item)=>item.category==='architecture'),
  };
  panel.innerHTML=''
    +'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>AI Insights</strong><span style="opacity:.7">'+(data.generatedAt||'')+'</span></div>'
    +'<p style="margin:8px 0 0;opacity:.82">'+data.summary.high+' high · '+data.summary.medium+' medium · '+data.summary.low+' low</p>'
    +'<div style="margin-top:10px;display:flex;gap:8px"><button data-tab="findings" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:rgba(255,255,255,.06);color:#f8f3ea;cursor:pointer">Findings</button><button data-tab="assistant" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Assistant</button></div>'
    +'<section data-view="findings" style="margin-top:10px">'
    +'<p style="margin:0"><strong>Security</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.security)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Performance</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.performance)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Design</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.design)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Architecture</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.architecture)+'</ul>'
    +'</section>'
    +'<section data-view="assistant" style="display:none;margin-top:10px">'
    +'<p style="margin:0;opacity:.84">Mode: '+data.assistant.mode+' · '+data.assistant.status+'</p>'
    +'<p style="margin:8px 0 0;opacity:.72">'+data.assistant.details+'</p>'
    +'<ul style="margin:8px 0 0;padding-left:18px">'+(data.assistant.suggestions||[]).map((line)=>'<li style="margin-top:6px">'+line+'</li>').join('')+'</ul>'
    +'</section>';

  const findingsButton=panel.querySelector('[data-tab="findings"]');
  const assistantButton=panel.querySelector('[data-tab="assistant"]');
  const findingsView=panel.querySelector('[data-view="findings"]');
  const assistantView=panel.querySelector('[data-view="assistant"]');
  findingsButton?.addEventListener('click',()=>{findingsView.style.display='block';assistantView.style.display='none';findingsButton.style.background='rgba(255,255,255,.06)';assistantButton.style.background='transparent';});
  assistantButton?.addEventListener('click',()=>{findingsView.style.display='none';assistantView.style.display='block';assistantButton.style.background='rgba(255,255,255,.06)';findingsButton.style.background='transparent';});
}

mount().catch((error)=>{console.warn('Fiyuu insights panel failed',error);});
host.append(toggle,panel);
document.body.append(host);
</script>`;
}

export function renderUnifiedToolsScript(input: {
  route: string;
  render: RenderMode;
  renderTimeMs: number;
  warnings: string[];
  requestId: string;
}): string {
  const metrics = JSON.stringify({
    route: input.route,
    render: input.render,
    renderTimeMs: input.renderTimeMs,
    warnings: input.warnings,
    requestId: input.requestId,
  });

  return `<script type="module">(function(){
const metrics=${metrics};
const removeLegacyPanels=()=>{const old=[...document.querySelectorAll('button')].filter((button)=>button.textContent==='Fiyuu Devtools'||button.textContent==='Fiyuu Insights');for(const button of old){const host=button.closest('div');if(host&&host.parentNode){host.parentNode.removeChild(host);}}};
removeLegacyPanels();
setInterval(removeLegacyPanels,500);

const host=document.createElement('div');
host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:10001;font:12px/1.5 ui-monospace,monospace';
const toggle=document.createElement('button');
toggle.textContent='Fiyuu Console';
toggle.style.cssText='border:1px solid rgba(197,214,181,.18);background:rgba(18,24,19,.94);color:#f8f3ea;border-radius:999px;padding:10px 14px;box-shadow:0 18px 56px rgba(0,0,0,.22);cursor:pointer';
const panel=document.createElement('aside');
panel.style.cssText='display:none;margin-top:10px;width:min(500px,calc(100vw - 30px));max-height:min(78vh,700px);overflow:auto;background:rgba(18,24,19,.96);color:#f8f3ea;border:1px solid rgba(197,214,181,.16);border-radius:18px;padding:14px 16px;box-shadow:0 18px 56px rgba(0,0,0,.22);backdrop-filter:blur(14px)';
toggle.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none';});

let serverTraceEnabled=false;
let pollingId;
const renderItems=(items)=>{if(!items.length){return '<li style="margin-top:6px">No findings.</li>';}return items.slice(0,8).map((item)=>'<li style="margin-top:8px"><strong>['+item.severity.toUpperCase()+'] '+item.title+'</strong><br/><span style="opacity:.82">'+item.summary+'</span><br/><span style="opacity:.72">'+item.recommendation+'</span></li>').join('');};
const renderServerItems=(events)=>{if(!events||!events.length){return '<li style="margin-top:6px">No server activity yet.</li>';}return events.slice(0,40).map((event)=>'<li style="margin-top:8px"><strong>'+event.event+'</strong><span style="opacity:.7"> ['+event.level.toUpperCase()+']</span><br/><span style="opacity:.75">'+event.at+'</span><br/><span style="opacity:.82">'+(event.details||'')+'</span></li>').join('');};
const refreshServerEvents=async()=>{if(!serverTraceEnabled){return;}const response=await fetch('/__fiyuu/server-events');if(!response.ok){return;}const payload=await response.json();const list=panel.querySelector('[data-server-list]');if(list){list.innerHTML=renderServerItems(payload.events||[]);}};
const startServerTrace=()=>{if(pollingId){clearInterval(pollingId);}pollingId=setInterval(()=>{refreshServerEvents().catch(()=>{});},1200);refreshServerEvents().catch(()=>{});};
const stopServerTrace=()=>{if(pollingId){clearInterval(pollingId);pollingId=undefined;}};

const mount=async()=>{
  const [runtimeResponse,insightsResponse]=await Promise.all([fetch('/__fiyuu/devtools'),fetch('/__fiyuu/insights')]);
  const runtime=runtimeResponse.ok?await runtimeResponse.json():{warnings:[],config:{featureFlags:{}}};
  const insights=insightsResponse.ok?await insightsResponse.json():{summary:{high:0,medium:0,low:0},assistant:{mode:'rule-only',status:'fallback',details:'unavailable'},items:[]};
  const warnings=(metrics.warnings.length?metrics.warnings:(runtime.warnings||[])).slice(0,4);
  const flags=Object.entries((runtime.config&&runtime.config.featureFlags)||{}).map(([k,v])=>'<span style="display:inline-flex;margin:4px 6px 0 0;padding:3px 8px;border-radius:999px;background:rgba(233,240,224,.08)">'+k+': '+v+'</span>').join('')||'<span style="opacity:.7">none</span>';
  const byCategory={security:(insights.items||[]).filter((i)=>i.category==='security'),performance:(insights.items||[]).filter((i)=>i.category==='performance'),design:(insights.items||[]).filter((i)=>i.category==='design'),architecture:(insights.items||[]).filter((i)=>i.category==='architecture')};

  panel.innerHTML=''
    +'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>Fiyuu Console</strong><span style="opacity:.7">'+metrics.requestId+'</span></div>'
    +'<div style="margin-top:10px;display:flex;gap:8px"><button data-tab="runtime" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:rgba(255,255,255,.06);color:#f8f3ea;cursor:pointer">Runtime</button><button data-tab="insights" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Insights</button><button data-tab="server" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Server</button></div>'
    +'<section data-view="runtime" style="margin-top:12px"><p style="margin:0;opacity:.86">Route <strong>'+metrics.route+'</strong> · '+String(metrics.render).toUpperCase()+' · '+metrics.renderTimeMs+'ms</p><p style="margin:8px 0 0;opacity:.7">Warnings</p><ul style="margin:6px 0 0;padding-left:18px">'+(warnings.map((w)=>'<li style="margin-top:6px">'+w+'</li>').join('')||'<li style="margin-top:6px">none</li>')+'</ul><p style="margin:10px 0 0;opacity:.7">Feature Flags</p><div style="margin-top:6px">'+flags+'</div></section>'
    +'<section data-view="insights" style="display:none;margin-top:12px"><p style="margin:0;opacity:.86">'+insights.summary.high+' high · '+insights.summary.medium+' medium · '+insights.summary.low+' low</p><p style="margin:8px 0 0;opacity:.72">Assistant: '+insights.assistant.mode+' ('+insights.assistant.status+')</p><p style="margin:8px 0 0;opacity:.72">'+insights.assistant.details+'</p><div style="margin-top:10px"><strong>Security</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.security)+'</ul></div><div style="margin-top:10px"><strong>Performance</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.performance)+'</ul></div><div style="margin-top:10px"><strong>Design</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.design)+'</ul></div><div style="margin-top:10px"><strong>Architecture</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.architecture)+'</ul></div></section>'
    +'<section data-view="server" style="display:none;margin-top:12px"><label style="display:flex;align-items:center;gap:8px"><input data-server-toggle type="checkbox"/> <span>Enable live server trace (dev only)</span></label><ul data-server-list style="margin:10px 0 0;padding-left:18px"></ul></section>';

  const runtimeButton=panel.querySelector('[data-tab="runtime"]');
  const insightsButton=panel.querySelector('[data-tab="insights"]');
  const serverButton=panel.querySelector('[data-tab="server"]');
  const runtimeView=panel.querySelector('[data-view="runtime"]');
  const insightsView=panel.querySelector('[data-view="insights"]');
  const serverView=panel.querySelector('[data-view="server"]');
  const serverToggle=panel.querySelector('[data-server-toggle]');
  runtimeButton?.addEventListener('click',()=>{runtimeView.style.display='block';insightsView.style.display='none';serverView.style.display='none';runtimeButton.style.background='rgba(255,255,255,.06)';insightsButton.style.background='transparent';serverButton.style.background='transparent';});
  insightsButton?.addEventListener('click',()=>{runtimeView.style.display='none';insightsView.style.display='block';serverView.style.display='none';insightsButton.style.background='rgba(255,255,255,.06)';runtimeButton.style.background='transparent';serverButton.style.background='transparent';});
  serverButton?.addEventListener('click',()=>{runtimeView.style.display='none';insightsView.style.display='none';serverView.style.display='block';serverButton.style.background='rgba(255,255,255,.06)';runtimeButton.style.background='transparent';insightsButton.style.background='transparent';});
  serverToggle?.addEventListener('change',(event)=>{serverTraceEnabled=Boolean(event.target&&event.target.checked);if(serverTraceEnabled){startServerTrace();}else{stopServerTrace();}});
};

mount().catch((error)=>{console.warn('Fiyuu console mount failed',error);});
host.append(toggle,panel);
document.body.append(host);
})();</script>`;
}
