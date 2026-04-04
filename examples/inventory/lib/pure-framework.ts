import { createSignal, html, raw, type RawHtml } from "@fiyuu/core/client";

type RenderBlock = string | (() => string);

type StoreListener<T> = (next: T) => void;
type StoreUpdater<T> = T | ((prev: T) => T);

function renderBlock(block?: RenderBlock): string {
  if (block == null) {
    return "";
  }

  if (typeof block === "function") {
    return block();
  }

  return block;
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

export function If(args: {
  condition: unknown;
  then: RenderBlock;
  else?: ElseBranch | RenderBlock;
}): string {
  if (args.condition) {
    return renderBlock(args.then);
  }

  if (!args.else) {
    return "";
  }

  if (typeof args.else === "object" && "kind" in args.else && args.else.kind === "Else") {
    return args.else.render();
  }

  return renderBlock(args.else as RenderBlock);
}

export function For<T>(args: {
  each: readonly T[] | T[];
  render: (item: T, index: number) => string;
  empty?: RenderBlock;
}): string {
  if (!args.each || args.each.length === 0) {
    return renderBlock(args.empty);
  }

  return args.each.map((item, index) => args.render(item, index)).join("");
}

export interface FlatStore<T extends Record<string, unknown>> {
  get(): T;
  set(next: StoreUpdater<T>): void;
  patch(next: Partial<T>): void;
  subscribe(listener: StoreListener<T>): () => void;
}

export function createFlatStore<T extends Record<string, unknown>>(initialState: T): FlatStore<T> {
  const signal = createSignal(initialState);

  return {
    get() {
      return signal.get();
    },
    set(next) {
      if (typeof next === "function") {
        const updater = next as (prev: T) => T;
        signal.set(updater(signal.get()));
        return;
      }

      signal.set(next);
    },
    patch(next) {
      signal.set({
        ...signal.get(),
        ...next,
      });
    },
    subscribe(listener) {
      return signal.subscribe(() => {
        listener(signal.get());
      });
    },
  };
}

let scopeCounter = 0;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "scope";
}

export function scopedStyles(name: string, css: string): { scopeClass: string; style: RawHtml } {
  scopeCounter += 1;
  const scopeClass = `fx-${slugify(name)}-${scopeCounter}`;
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

  const script = `(function(){
    var root = document.querySelector('[data-fiyuu-island="${safeId}"]');
    if (!root) return;

    var started = false;

    function start() {
      if (started) return;
      started = true;
      ${options.bootCode}
    }

    if ("${trigger}" === "click") {
      root.addEventListener("click", start, { once: true });
      return;
    }

    if ("${trigger}" === "hover") {
      root.addEventListener("mouseenter", start, { once: true });
      root.addEventListener("focusin", start, { once: true });
      return;
    }

    if (typeof window.IntersectionObserver !== "function") {
      start();
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i += 1) {
        if (!entries[i].isIntersecting) continue;
        observer.disconnect();
        start();
        break;
      }
    }, { rootMargin: "220px" });

    observer.observe(root);
  })();`;

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
  const script = `(function() {
    var lastTag = "unknown";

    function findTag(target) {
      if (!target || !target.closest) return null;
      var tagged = target.closest("[data-fiyuu-debug-tag]");
      if (!tagged) return null;
      return tagged.getAttribute("data-fiyuu-debug-tag");
    }

    document.addEventListener("pointerdown", function(event) {
      var tag = findTag(event.target);
      if (tag) lastTag = tag;
    }, true);

    document.addEventListener("focusin", function(event) {
      var tag = findTag(event.target);
      if (tag) lastTag = tag;
    }, true);

    function inferHint(message) {
      var text = String(message || "").toLowerCase();
      if (text.includes("undefined") || text.includes("null")) {
        return "Eksik null/undefined kontrolu var. Verinin geldigi yeri kontrol et.";
      }
      if (text.includes("is not a function")) {
        return "Fonksiyon yerine farkli bir tip geciyor. Cagrilan methodu dogrula.";
      }
      if (text.includes("json")) {
        return "Beklenen veri formati ile gelen cevap uyusmuyor. Query/action ciktisini kontrol et.";
      }
      return "Kosul bloklarinda beklenmeyen bir durum olabilir. Son degisen bolumu kontrol et.";
    }

    function getPanel() {
      var panel = document.getElementById("fiyuu-human-debug");
      if (panel) return panel;

      panel = document.createElement("aside");
      panel.id = "fiyuu-human-debug";
      panel.style.position = "fixed";
      panel.style.right = "16px";
      panel.style.bottom = "16px";
      panel.style.maxWidth = "min(92vw, 480px)";
      panel.style.padding = "12px 14px";
      panel.style.borderRadius = "10px";
      panel.style.border = "1px solid #fecaca";
      panel.style.background = "#fff1f2";
      panel.style.color = "#7f1d1d";
      panel.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
      panel.style.fontSize = "12px";
      panel.style.lineHeight = "1.45";
      panel.style.whiteSpace = "pre-line";
      panel.style.zIndex = "99999";
      panel.style.boxShadow = "0 10px 28px rgba(0,0,0,0.12)";
      document.body.appendChild(panel);
      return panel;
    }

    if (!window.fiyuu || typeof window.fiyuu.onError !== "function") {
      return;
    }

    window.fiyuu.onError(function(detail) {
      var source = detail && detail.source ? detail.source : "unknown file";
      var line = detail && detail.line ? ":" + detail.line : "";
      var message = detail && detail.message ? detail.message : "Unknown runtime error";
      var hint = inferHint(message);
      var tag = lastTag;
      var activeElement = document.activeElement;

      if (tag === "unknown" && activeElement && activeElement.tagName) {
        tag = activeElement.tagName.toLowerCase();
      }

      var panel = getPanel();
      panel.textContent = [
        "Insancil Hata Analizi",
        "Mesaj: " + message,
        "Dosya: " + source + line,
        "Etiket/Bolum: " + tag,
        "Ihtimal: " + hint,
      ].join("\\n");

      console.error("[Fiyuu Human Debug]", {
        message: message,
        source: source + line,
        tag: tag,
        hint: hint,
        original: detail,
      });
    });
  })();`;

  return raw(`<script>${script}</script>`);
}
