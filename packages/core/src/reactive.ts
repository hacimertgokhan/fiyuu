import { html, raw, unsafeHtml, type ComponentProps, type RawHtml } from "./template.js";

export type Signal<T> = {
  get(): T;
  set(next: T): void;
  subscribe(fn: () => void): () => void;
};

type RenderBlock = string | (() => string);

export function createSignal<T>(initial: T): Signal<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get() {
      return value;
    },
    set(next: T) {
      if (value === next) return;
      value = next;
      for (const fn of listeners) fn();
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// Note: 'when' is also defined in intent.ts with more features
export function whenCondition(condition: unknown, content: string | (() => string)): string {
  if (!condition) return "";
  return typeof content === "function" ? content() : content;
}

export type ElseBranch = {
  kind: "Else";
  render: () => string;
};

export function Else(content: RenderBlock): ElseBranch {
  return {
    kind: "Else",
    render: () => renderBlock(content),
  };
}

export function If(input: {
  condition: unknown;
  then: RenderBlock;
  else?: RenderBlock | ElseBranch;
}): string {
  if (input.condition) {
    return renderBlock(input.then);
  }

  if (!input.else) {
    return "";
  }

  if (isElseBranch(input.else)) {
    return input.else.render();
  }

  return renderBlock(input.else);
}

function isElseBranch(value: unknown): value is ElseBranch {
  return Boolean(
    value &&
      typeof value === "object" &&
      "kind" in value &&
      "render" in value &&
      (value as { kind?: unknown }).kind === "Else" &&
      typeof (value as { render?: unknown }).render === "function",
  );
}

function renderBlock(block?: RenderBlock): string {
  if (block == null) {
    return "";
  }

  if (typeof block === "function") {
    return block();
  }

  return block;
}

export function each<T>(
  items: T[] | readonly T[],
  renderItem: (item: T, index: number) => string,
): string {
  if (!items || items.length === 0) return "";
  return items.map(renderItem).join("");
}

export function For<T>(input: {
  each: readonly T[] | T[];
  render: (item: T, index: number) => string;
  empty?: RenderBlock;
}): string {
  if (!input.each || input.each.length === 0) {
    return renderBlock(input.empty);
  }

  return input.each.map((item, index) => input.render(item, index)).join("");
}

let _eventId = 0;
const _eventRegistry = new Map<string, (event: Event) => void>();

export function onEvent(handler: (event: Event) => void): string {
  const id = `fiyuu_evt_${_eventId++}`;
  _eventRegistry.set(id, handler);
  return id;
}

export function getEventHandler(id: string): ((event: Event) => void) | undefined {
  return _eventRegistry.get(id);
}

export function clearEventRegistry(): void {
  _eventRegistry.clear();
  _eventId = 0;
}

export function mount(
  root: HTMLElement,
  render: () => string,
  signals: Signal<unknown>[] = [],
): () => void {
  function update(): void {
    root.innerHTML = render();
    attachDeclarativeEvents(root);
  }

  update();

  const unsubscribers = signals.map((s) => s.subscribe(update));
  return () => {
    unsubscribers.forEach((u) => u());
    root.innerHTML = "";
  };
}

function attachDeclarativeEvents(root: HTMLElement): void {
  const elements = root.querySelectorAll("[data-fiyuu-on]");
  for (const el of elements) {
    const parts = el.getAttribute("data-fiyuu-on")!.split(":");
    if (parts.length !== 2) continue;

    const [eventName, handlerId] = parts as [string, string];
    const handler = _eventRegistry.get(handlerId);
    if (handler) {
      el.addEventListener(eventName, handler);
    }
  }
}

export function createFiyuuStore<T>(initialValue: T) {
  const signal = createSignal(initialValue);
  return {
    get: signal.get,
    set: signal.set,
    subscribe: signal.subscribe,
  };
}

export function createFlatStore<T>(initialValue: T) {
  return createFiyuuStore(initialValue);
}

let scopedStyleCounter = 0;

function toScopeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "scope";
}

export function scopedStyles(name: string, css: string): { scopeClass: string; style: RawHtml } {
  scopedStyleCounter += 1;
  const scopeClass = `fx-${toScopeSlug(name)}-${scopedStyleCounter}`;
  const scopedCss = css.replaceAll(":scope", `.${scopeClass}`);

  return {
    scopeClass,
    style: raw(`<style>${scopedCss}</style>`),
  };
}

function escapeSingleQuotes(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export function island(options: {
  id: string;
  placeholder: string;
  bootCode: string;
  trigger?: "click" | "hover" | "visible";
}): string {
  const trigger = options.trigger ?? "click";
  const safeId = escapeSingleQuotes(options.id);

  const script = `(function(){\n  var root = document.querySelector('[data-fiyuu-island="${safeId}"]');\n  if (!root) return;\n\n  var started = false;\n\n  function start() {\n    if (started) return;\n    started = true;\n    ${options.bootCode}\n  }\n\n  if ("${trigger}" === "click") {\n    root.addEventListener("click", start, { once: true });\n    return;\n  }\n\n  if ("${trigger}" === "hover") {\n    root.addEventListener("mouseenter", start, { once: true });\n    root.addEventListener("focusin", start, { once: true });\n    return;\n  }\n\n  if (typeof window.IntersectionObserver !== "function") {\n    start();\n    return;\n  }\n\n  var observer = new IntersectionObserver(function(entries) {\n    for (var i = 0; i < entries.length; i += 1) {\n      if (!entries[i].isIntersecting) continue;\n      observer.disconnect();\n      start();\n      break;\n    }\n  }, { rootMargin: "220px" });\n\n  observer.observe(root);\n})();`;

  return html`
    <section data-fiyuu-island="${options.id}">
      ${raw(options.placeholder)}
    </section>
    <script>${raw(script)}</script>
  `;
}

export function debugTag(name: string, content: string): string {
  return html`<section data-fiyuu-debug-tag="${name}">${raw(content)}</section>`;
}

export function humanDebugOverlay(): RawHtml {
  const script = `(function() {\n  var lastTag = "unknown";\n\n  function findTag(target) {\n    if (!target || !target.closest) return null;\n    var tagged = target.closest("[data-fiyuu-debug-tag]");\n    if (!tagged) return null;\n    return tagged.getAttribute("data-fiyuu-debug-tag");\n  }\n\n  document.addEventListener("pointerdown", function(event) {\n    var tag = findTag(event.target);\n    if (tag) lastTag = tag;\n  }, true);\n\n  document.addEventListener("focusin", function(event) {\n    var tag = findTag(event.target);\n    if (tag) lastTag = tag;\n  }, true);\n\n  function inferHint(message) {\n    var text = String(message || "").toLowerCase();\n    if (text.includes("undefined") || text.includes("null")) {\n      return "Eksik null/undefined kontrolu var. Verinin geldigi yeri kontrol et.";\n    }\n    if (text.includes("is not a function")) {\n      return "Fonksiyon yerine farkli bir tip geciyor. Cagrilan methodu dogrula.";\n    }\n    if (text.includes("json")) {\n      return "Beklenen veri formati ile gelen cevap uyusmuyor. Query/action ciktisini kontrol et.";\n    }\n    return "Kosul bloklarinda beklenmeyen bir durum olabilir. Son degisen bolumu kontrol et.";\n  }\n\n  function getPanel() {\n    var panel = document.getElementById("fiyuu-human-debug");\n    if (panel) return panel;\n\n    panel = document.createElement("aside");\n    panel.id = "fiyuu-human-debug";\n    panel.style.position = "fixed";\n    panel.style.right = "16px";\n    panel.style.bottom = "16px";\n    panel.style.maxWidth = "min(92vw, 480px)";\n    panel.style.padding = "12px 14px";\n    panel.style.borderRadius = "10px";\n    panel.style.border = "1px solid #fecaca";\n    panel.style.background = "#fff1f2";\n    panel.style.color = "#7f1d1d";\n    panel.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";\n    panel.style.fontSize = "12px";\n    panel.style.lineHeight = "1.45";\n    panel.style.whiteSpace = "pre-line";\n    panel.style.zIndex = "99999";\n    panel.style.boxShadow = "0 10px 28px rgba(0,0,0,0.12)";\n    document.body.appendChild(panel);\n    return panel;\n  }\n\n  if (!window.fiyuu || typeof window.fiyuu.onError !== "function") {\n    return;\n  }\n\n  window.fiyuu.onError(function(detail) {\n    var source = detail && detail.source ? detail.source : "unknown file";\n    var line = detail && detail.line ? ":" + detail.line : "";\n    var message = detail && detail.message ? detail.message : "Unknown runtime error";\n    var hint = inferHint(message);\n    var tag = lastTag;\n    var activeElement = document.activeElement;\n\n    if (tag === "unknown" && activeElement && activeElement.tagName) {\n      tag = activeElement.tagName.toLowerCase();\n    }\n\n    var panel = getPanel();\n    panel.textContent = [\n      "Insancil Hata Analizi",\n      "Mesaj: " + message,\n      "Dosya: " + source + line,\n      "Etiket/Bolum: " + tag,\n      "Ihtimal: " + hint,\n    ].join("\\n");\n  });\n})();`;

  return raw(`<script>${script}</script>`);
}

export type FiyuuStore<T> = ReturnType<typeof createFiyuuStore<T>>;
