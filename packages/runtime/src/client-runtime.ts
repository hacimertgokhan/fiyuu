/**
 * Fiyuu Client Runtime
 *
 * A small script injected into every page that provides:
 *   - fiyuu.theme   — dark/light mode management
 *   - fiyuu.state   — simple reactive state with DOM binding
 *   - fiyuu.bind    — shorthand for updating element text / html
 *   - fiyuu.router  — client-side navigation without page reload
 *   - fiyuu.partial — replace a DOM element with a fetched route's content
 *   - fiyuu.onError — global client-side error handler
 *   - fiyuu.ws      — WebSocket connection helper
 *
 * Everything is accessible via window.fiyuu in page scripts.
 */

export function buildClientRuntime(websocketPath: string): string {
  return `<script id="fiyuu-runtime">(function(){
window.fiyuu = {

  // ── Theme ──────────────────────────────────────────────────────────────────
  // fiyuu.theme.get()              → "light" | "dark"
  // fiyuu.theme.set("dark")        → sets theme, saves to localStorage
  // fiyuu.theme.toggle()           → flips between light and dark
  // fiyuu.theme.bindToggle("id")   → wires a button to toggle + updates its label
  // fiyuu.theme.onChange(fn)       → calls fn whenever theme changes
  theme: {
    get: function() {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    },
    set: function(value) {
      var isDark = value === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.setAttribute("data-theme", value);
      try { localStorage.setItem("fiyuu-theme", value); } catch(e) {}
      document.dispatchEvent(new CustomEvent("fiyuu:theme", { detail: { theme: value } }));
    },
    toggle: function() {
      this.set(this.get() === "dark" ? "light" : "dark");
    },
    bindToggle: function(elementId) {
      var el = document.getElementById(elementId);
      if (!el) return;
      var self = this;
      var sync = function() { el.textContent = self.get() === "dark" ? "Light" : "Dark"; };
      sync();
      el.addEventListener("click", function() { self.toggle(); sync(); });
    },
    onChange: function(callback) {
      document.addEventListener("fiyuu:theme", function(e) { callback(e.detail.theme); });
    }
  },

  // ── Bind ───────────────────────────────────────────────────────────────────
  // fiyuu.bind("element-id", value)    → sets element's text content
  // fiyuu.bind("element-id", value, true) → sets innerHTML instead
  bind: function(elementId, value, asHtml) {
    var el = document.getElementById(elementId);
    if (!el) return;
    if (asHtml) { el.innerHTML = String(value != null ? value : ""); }
    else { el.textContent = String(value != null ? value : ""); }
  },

  // ── State ──────────────────────────────────────────────────────────────────
  // var counter = fiyuu.state("counter", 0)
  // counter.get()              → current value
  // counter.set(5)             → updates value, fires "fiyuu:state:counter" event
  // counter.bind("element-id") → auto-updates element when state changes
  // counter.onChange(fn)       → calls fn(newValue) on every update
  state: function(key, initialValue) {
    var current = initialValue;
    var eventName = "fiyuu:state:" + key;
    return {
      get: function() { return current; },
      set: function(next) {
        current = next;
        document.dispatchEvent(new CustomEvent(eventName, { detail: next }));
      },
      bind: function(elementId) {
        window.fiyuu.bind(elementId, current);
        document.addEventListener(eventName, function(e) {
          window.fiyuu.bind(elementId, e.detail);
        });
        return this;
      },
      onChange: function(callback) {
        document.addEventListener(eventName, function(e) { callback(e.detail); });
        return this;
      }
    };
  },

  // ── Partial ────────────────────────────────────────────────────────────────
  // fiyuu.partial("element-id", "/route")   → fetches route body, replaces element
  // fiyuu.partial("element-id", "/route", { loading: "<p>Loading…</p>" })
  partial: async function(elementId, url, options) {
    var el = document.getElementById(elementId);
    if (!el) return;
    if (options && options.loading) el.innerHTML = options.loading;
    try {
      var parsed = new URL(url, location.href);
      var res = await fetch(parsed.pathname + parsed.search, {
        headers: { "x-fiyuu-navigate": "1" },
        credentials: "same-origin",
      });
      if (!res.ok || res.headers.get("x-fiyuu-navigate") !== "1") return;
      var payload = await res.json();
      el.innerHTML = payload.body || "";
      var scripts = el.querySelectorAll("script");
      for (var i = 0; i < scripts.length; i++) {
        var old = scripts[i];
        var next = document.createElement("script");
        for (var j = 0; j < old.attributes.length; j++) next.setAttribute(old.attributes[j].name, old.attributes[j].value);
        next.textContent = old.textContent;
        old.parentNode.replaceChild(next, old);
      }
    } catch(e) {}
  },

  // ── onError ────────────────────────────────────────────────────────────────
  // fiyuu.onError(function(event) { ... })   → called on unhandled JS errors
  onError: function(callback) {
    window.addEventListener("error", function(event) {
      callback({ message: event.message, error: event.error, source: event.filename, line: event.lineno });
    });
    window.addEventListener("unhandledrejection", function(event) {
      var reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason || "Unhandled rejection"));
      callback({ message: reason.message, error: reason, source: null, line: null });
    });
  },

  // ── Router ─────────────────────────────────────────────────────────────────
  // fiyuu.router.navigate("/about")   → client-side navigation (no reload)
  // fiyuu.router.on("navigate", fn)   → called after each navigation with { route, render }
  // fiyuu.router.on("before", fn)     → called before navigation; return false to cancel
  // Links with data-fiyuu-link (or all same-origin <a> tags) are intercepted automatically.
  router: (function() {
    var listeners = { navigate: [], before: [] };

    function emit(event, detail) {
      for (var i = 0; i < listeners[event].length; i++) {
        if (listeners[event][i](detail) === false) return false;
      }
      return true;
    }

    function rerunScripts(container) {
      var scripts = container.querySelectorAll("script");
      for (var i = 0; i < scripts.length; i++) {
        var old = scripts[i];
        var next = document.createElement("script");
        for (var j = 0; j < old.attributes.length; j++) {
          next.setAttribute(old.attributes[j].name, old.attributes[j].value);
        }
        next.textContent = old.textContent;
        old.parentNode.replaceChild(next, old);
      }
    }

    async function navigate(url, push) {
      var href = typeof url === "string" ? url : url.href;
      var parsed = new URL(href, location.href);
      if (parsed.origin !== location.origin) { location.href = href; return; }
      if (emit("before", { route: parsed.pathname }) === false) return;

      try {
        var res = await fetch(parsed.pathname + parsed.search, {
          headers: { "x-fiyuu-navigate": "1" },
          credentials: "same-origin",
        });
        if (!res.ok || res.headers.get("x-fiyuu-navigate") !== "1") {
          location.href = href;
          return;
        }
        var payload = await res.json();
        var app = document.getElementById("app");
        if (app) {
          app.innerHTML = payload.body || "";
          rerunScripts(app);
        }
        document.title = payload.title || document.title;
        window.__FIYUU_ROUTE__ = payload.route;
        window.__FIYUU_DATA__ = payload.data;
        window.__FIYUU_RENDER__ = payload.render;
        if (push !== false) history.pushState({ route: payload.route }, payload.title || "", parsed.pathname + parsed.search);
        window.scrollTo(0, 0);
        emit("navigate", { route: payload.route, render: payload.render, title: payload.title });
      } catch(e) {
        location.href = href;
      }
    }

    function intercept() {
      document.addEventListener("click", function(event) {
        var target = event.target.closest("a[href]");
        if (!target) return;
        var href = target.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        var parsed = new URL(href, location.href);
        if (parsed.origin !== location.origin) return;
        if (target.hasAttribute("data-fiyuu-reload")) return;
        event.preventDefault();
        navigate(parsed.pathname + parsed.search, true);
      });
      window.addEventListener("popstate", function(event) {
        navigate(location.pathname + location.search, false);
      });
    }

    document.addEventListener("DOMContentLoaded", intercept);

    return {
      navigate: function(url) { return navigate(url, true); },
      on: function(event, fn) {
        if (listeners[event]) listeners[event].push(fn);
        return this;
      },
    };
  })(),

  // ── WebSocket ──────────────────────────────────────────────────────────────
  // var ws = fiyuu.ws()
  // ws.on("counter:tick", (data) => { ... })   → listens for a message type
  // ws.onOpen(fn)  / ws.onClose(fn) / ws.onError(fn)
  // ws.send({ type: "ping" })
  // ws.status()   → "connecting" | "connected" | "closed" | "unavailable"
  ws: function(overridePath) {
    var wsPath = overridePath || window.__FIYUU_WS_PATH__ || ${JSON.stringify(websocketPath)};
    var protocol = location.protocol === "https:" ? "wss" : "ws";
    var socket = new WebSocket(protocol + "://" + location.host + wsPath);
    var handlers = {};
    var statusValue = "connecting";

    socket.addEventListener("open", function() { statusValue = "connected"; });
    socket.addEventListener("close", function() {
      if (statusValue !== "unavailable") statusValue = "closed";
    });
    socket.addEventListener("error", function() { statusValue = "unavailable"; });
    socket.addEventListener("message", function(event) {
      try {
        var payload = JSON.parse(event.data);
        if (payload && payload.type && handlers[payload.type]) {
          handlers[payload.type](payload);
        }
      } catch(e) {}
    });

    return {
      on: function(type, handler) { handlers[type] = handler; return this; },
      onOpen: function(handler) { socket.addEventListener("open", handler); return this; },
      onClose: function(handler) { socket.addEventListener("close", handler); return this; },
      onError: function(handler) { socket.addEventListener("error", handler); return this; },
      send: function(data) { socket.send(JSON.stringify(data)); return this; },
      status: function() { return statusValue; },
      socket: socket
    };
  }

};
})();</script>`;
}
