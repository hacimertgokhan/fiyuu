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
  return `(function(){
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
    var navCache = new Map();
    var inflightNav = new Map();
    var inflightPrefetch = new Map();
    var prefetchedRoutes = new Set();
    var MAX_NAV_CACHE = 24;

    function canPrefetch() {
      var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return true;
      if (connection.saveData) return false;
      var type = connection.effectiveType || "";
      return type !== "slow-2g" && type !== "2g";
    }

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

    function rememberRoute(key, payload) {
      if (!key) return;
      if (navCache.has(key)) navCache.delete(key);
      navCache.set(key, payload);
      if (navCache.size > MAX_NAV_CACHE) {
        var firstKey = navCache.keys().next();
        if (!firstKey.done) navCache.delete(firstKey.value);
      }
    }

    function scheduleIdle(task) {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(task, { timeout: 1200 });
      } else {
        setTimeout(task, 80);
      }
    }

    function prefetchRouteFromHref(href) {
      if (!canPrefetch()) return;
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      var parsed = new URL(href, location.href);
      if (parsed.origin !== location.origin) return;
      var cacheKey = parsed.pathname + parsed.search;
      if (prefetchedRoutes.has(cacheKey)) return;
      if (navCache.has(cacheKey) || inflightNav.has(cacheKey) || inflightPrefetch.has(cacheKey)) return;

      scheduleIdle(function() {
        var pending = fetch(cacheKey, {
          headers: { "x-fiyuu-navigate": "1" },
          credentials: "same-origin",
        }).then(function(res) {
          if (!res.ok || res.headers.get("x-fiyuu-navigate") !== "1") return null;
          return res.json();
        }).then(function(payload) {
          if (payload) {
            prefetchedRoutes.add(cacheKey);
            rememberRoute(cacheKey, payload);
          }
        }).catch(function() {
          return null;
        }).finally(function() {
          inflightPrefetch.delete(cacheKey);
        });
        inflightPrefetch.set(cacheKey, pending);
      });
    }

    function applyPayload(payload, parsed, push) {
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
    }

    async function navigate(url, push) {
      var href = typeof url === "string" ? url : url.href;
      var parsed = new URL(href, location.href);
      var cacheKey = parsed.pathname + parsed.search;
      if (parsed.origin !== location.origin) { location.href = href; return; }
      if (push !== false && cacheKey === location.pathname + location.search) return;
      if (emit("before", { route: parsed.pathname }) === false) return;

      if (navCache.has(cacheKey)) {
        applyPayload(navCache.get(cacheKey), parsed, push);
        return;
      }

      try {
        var prefetched = inflightPrefetch.get(cacheKey);
        if (prefetched) {
          var prefetchedPayload = await prefetched;
          inflightPrefetch.delete(cacheKey);
          if (prefetchedPayload) {
            rememberRoute(cacheKey, prefetchedPayload);
            applyPayload(prefetchedPayload, parsed, push);
            return;
          }
        }

        var pending = inflightNav.get(cacheKey);
        if (!pending) {
          pending = fetch(cacheKey, {
            headers: { "x-fiyuu-navigate": "1" },
            credentials: "same-origin",
          });
          inflightNav.set(cacheKey, pending);
        }
        var res = await pending;
        inflightNav.delete(cacheKey);
        if (!res.ok || res.headers.get("x-fiyuu-navigate") !== "1") {
          location.href = href;
          return;
        }
        var payload = await res.json();
        rememberRoute(cacheKey, payload);
        applyPayload(payload, parsed, push);
      } catch(e) {
        inflightNav.delete(cacheKey);
        location.href = href;
      }
    }

    function intercept() {
      document.addEventListener("mouseover", function(event) {
        var target = event.target.closest("a[href]");
        if (!target) return;
        if (target.hasAttribute("data-fiyuu-no-prefetch")) return;
        prefetchRouteFromHref(target.getAttribute("href"));
      });

      document.addEventListener("focusin", function(event) {
        var target = event.target.closest("a[href]");
        if (!target) return;
        if (target.hasAttribute("data-fiyuu-no-prefetch")) return;
        prefetchRouteFromHref(target.getAttribute("href"));
      });

      if (typeof window.IntersectionObserver === "function") {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var link = entry.target;
            if (link.hasAttribute("data-fiyuu-no-prefetch")) {
              observer.unobserve(link);
              return;
            }
            prefetchRouteFromHref(link.getAttribute("href"));
            observer.unobserve(link);
          });
        }, { rootMargin: "280px" });

        document.querySelectorAll("a[href]").forEach(function(link) {
          observer.observe(link);
        });
      }

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

  // ── Action ─────────────────────────────────────────────────────────────────
  // fiyuu.action('/blog', payload)
  // fiyuu.action('/blog', payload, { status: 'el-id', loading: 'Processing...', onSuccess: fn, onError: fn })
  //   → POSTs JSON payload to route, returns response body (never throws)
  //   → status: element id to display loading/result messages
  //   → loading: message shown while request is in flight
  //   → errorMessage: message shown on failure (default: 'İşlem başarısız oldu.')
  //   → onSuccess(body): called when body.success === true
  //   → onError(err): called on network/HTTP error
  action: async function(route, payload, options) {
    var opts = options || {};
    var statusEl = opts.status ? document.getElementById(opts.status) : null;
    if (statusEl && opts.loading != null) statusEl.textContent = opts.loading;
    try {
      var res = await fetch(route, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var body = await res.json();
      if (statusEl && body.message) statusEl.textContent = body.message;
      if (body.success && opts.onSuccess) opts.onSuccess(body);
      return body;
    } catch(err) {
      if (statusEl) statusEl.textContent = opts.errorMessage || "İşlem başarısız oldu.";
      if (opts.onError) opts.onError(err);
      return { success: false };
    }
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  // fiyuu.modal.open('my-modal')    → shows element (display:flex)
  // fiyuu.modal.close('my-modal')   → hides element (display:none)
  // fiyuu.modal.toggle('my-modal')  → toggles visibility
  //
  // Declarative (auto-wired on DOMContentLoaded):
  //   <div id="my-modal" data-fiyuu-modal style="display:none">…</div>
  //   <button data-fiyuu-open="my-modal">Open</button>
  //   <button data-fiyuu-close="my-modal">Close</button>
  //   Clicking backdrop (the modal element itself) auto-closes it.
  modal: {
    open: function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = "flex";
    },
    close: function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = "none";
    },
    toggle: function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = el.style.display === "none" ? "flex" : "none";
    }
  },

  // ── data ───────────────────────────────────────────────────────────────────
  // fiyuu.data('my-id')   → parses JSON from <script type="application/json" id="my-id">
  //   Use clientData() helper in page.tsx to embed server data safely.
  data: function(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent || "null"); } catch(e) { return null; }
  },

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
  },

  // ── Channel (realtime) ─────────────────────────────────────────────────────
  // fiyuu.channel('chat').on('new-message', (data) => { ... })
  // fiyuu.channel('chat').emit('message', { text: 'hello' })
  channel: function(name) {
    var channelHandlers = {};
    var ws = window.fiyuu.ws();

    ws.socket.addEventListener("message", function(event) {
      try {
        var payload = JSON.parse(event.data);
        if (payload && payload.channel === name && payload.event && channelHandlers[payload.event]) {
          channelHandlers[payload.event](payload.data);
        }
      } catch(e) {}
    });

    return {
      on: function(event, handler) {
        channelHandlers[event] = handler;
        return this;
      },
      emit: function(event, data) {
        ws.send({ channel: name, event: event, data: data, ts: Date.now() });
        return this;
      },
      off: function(event) {
        delete channelHandlers[event];
        return this;
      }
    };
  }

};

// ── Declarative wiring (runs after DOM is ready) ───────────────────────────
// Wires [data-fiyuu-open], [data-fiyuu-close], [data-fiyuu-modal] automatically.
// Also handles forms with [data-fiyuu-action] for zero-boilerplate action calls.
document.addEventListener("DOMContentLoaded", function() {
  // Modal openers: <button data-fiyuu-open="modal-id">
  document.querySelectorAll("[data-fiyuu-open]").forEach(function(el) {
    el.addEventListener("click", function() {
      window.fiyuu.modal.open(el.getAttribute("data-fiyuu-open"));
    });
  });
  // Modal closers: <button data-fiyuu-close="modal-id">
  document.querySelectorAll("[data-fiyuu-close]").forEach(function(el) {
    el.addEventListener("click", function() {
      window.fiyuu.modal.close(el.getAttribute("data-fiyuu-close"));
    });
  });
  // Backdrop close: <div id="modal-id" data-fiyuu-modal …>
  document.querySelectorAll("[data-fiyuu-modal]").forEach(function(modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === modal) window.fiyuu.modal.close(modal.id);
    });
  });
  // Declarative form actions:
  //   <form data-fiyuu-action="/route" data-fiyuu-status="el-id" data-fiyuu-success="reload|close:modal-id">
  document.querySelectorAll("form[data-fiyuu-action]").forEach(function(form) {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      var route = form.getAttribute("data-fiyuu-action");
      var statusId = form.getAttribute("data-fiyuu-status") || undefined;
      var successAction = form.getAttribute("data-fiyuu-success") || "reload";
      var loadingMsg = form.getAttribute("data-fiyuu-loading") || "İşleniyor...";
      var data = {};
      new FormData(form).forEach(function(value, key) { data[key] = value; });
      form.querySelectorAll("input[type=checkbox]").forEach(function(input) {
        data[input.name] = input.checked;
      });
      var body = await window.fiyuu.action(route, data, { status: statusId, loading: loadingMsg });
      if (body.success) {
        if (successAction === "reload") { setTimeout(function() { location.reload(); }, 300); }
        else if (successAction.startsWith("close:")) { window.fiyuu.modal.close(successAction.slice(6)); }
      }
    });
  });
});

})();`;
}
