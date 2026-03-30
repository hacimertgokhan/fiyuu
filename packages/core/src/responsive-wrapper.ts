import { escapeHtml } from "./template.js";

export type BreakpointPreset = "mobile-first" | "desktop-first" | "full-width" | "article" | "card" | "dashboard" | "narrow";
export type PreviewDevice = "phone" | "tablet" | "watch" | "desktop";
export type PreviewMode = "mobile" | "desktop" | "both";

export interface ResponsiveWrapperOptions {
  content: string;
  class?: string;
  style?: string;
  maxWidth?: number;
  padding?: "none" | "sm" | "md" | "lg" | "xl" | string;
  previewEnabled?: boolean;
  previewLabel?: string;
  id?: string;
  preset?: BreakpointPreset;
  /** Default preview mode */
  defaultPreviewMode?: PreviewMode;
}

const PRESETS: Record<BreakpointPreset, { maxWidth: number; padding: string; class: string }> = {
  "mobile-first": { maxWidth: 768, padding: "1rem", class: "rw-mobile-first" },
  "desktop-first": { maxWidth: 1280, padding: "1rem", class: "rw-desktop-first" },
  "full-width": { maxWidth: 0, padding: "0", class: "rw-full-width" },
  "article": { maxWidth: 720, padding: "1.5rem", class: "rw-article" },
  "card": { maxWidth: 480, padding: "1rem", class: "rw-card" },
  "dashboard": { maxWidth: 1440, padding: "1rem", class: "rw-dashboard" },
  "narrow": { maxWidth: 540, padding: "1rem", class: "rw-narrow" },
};

const DEVICES: Record<PreviewDevice, { width: number; height: number; label: string; icon: string; scale: number }> = {
  phone: {
    width: 375,
    height: 812,
    label: "iPhone",
    scale: 0.55,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
  },
  tablet: {
    width: 768,
    height: 1024,
    label: "iPad",
    scale: 0.42,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
  },
  watch: {
    width: 200,
    height: 240,
    label: "Watch",
    scale: 0.65,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="6" y="5" width="12" height="14" rx="3"/><path d="M12 12h.01M9 5V3M15 5V3M9 19v2M15 19v2"/></svg>',
  },
  desktop: {
    width: 1280,
    height: 800,
    label: "Desktop",
    scale: 0.38,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  },
};

export function responsiveWrapper(options: ResponsiveWrapperOptions): string {
  const {
    content,
    class: customClass = "",
    style: customStyle = "",
    maxWidth: customMaxWidth,
    padding: customPadding,
    previewEnabled = true,
    previewLabel = "Responsive",
    id,
    preset = "mobile-first",
    defaultPreviewMode = "both",
  } = options;

  const presetConfig = PRESETS[preset];
  const maxWidth = customMaxWidth ?? presetConfig.maxWidth;
  const containerClass = customClass || presetConfig.class;

  const widthStyle = maxWidth > 0 ? `max-width:${maxWidth}px;` : "";
  const paddingStyle = getPaddingStyle(customPadding ?? presetConfig.padding);

  const wrapperId = id || `rw-${generateId()}`;

  const previewButton = previewEnabled ? buildPreviewButton(wrapperId) : "";
  const previewPanel = previewEnabled ? buildPreviewPanel(wrapperId, content, preset, defaultPreviewMode) : "";
  const previewStyles = previewEnabled ? buildPreviewStyles() : "";

  return `<div id="${wrapperId}" class="fiyuu-responsive-wrapper ${containerClass}" style="position:relative;width:100%;${widthStyle}${paddingStyle}${customStyle}">${previewButton}${content}${previewPanel}</div>${previewStyles}`;
}

function getPaddingStyle(padding: string): string {
  if (!padding || padding === "none") return "";
  const map: Record<string, string> = { sm: "0.75rem", md: "1rem", lg: "1.5rem", xl: "2rem" };
  return `padding:${map[padding] || padding};`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

function buildPreviewButton(wrapperId: string): string {
  return `<button type="button" class="fiyuu-rw-btn" onclick="window.__fiyuu_rw_open('${wrapperId}')" aria-label="Responsive Preview" title="Responsive Preview">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    <span>Responsive Preview</span>
  </button>`;
}

function buildPreviewPanel(wrapperId: string, content: string, preset: string, defaultMode: PreviewMode): string {
  const phoneDevice = DEVICES.phone;
  const tabletDevice = DEVICES.tablet;
  const watchDevice = DEVICES.watch;
  const desktopDevice = DEVICES.desktop;

  return `<div id="${wrapperId}-panel" class="fiyuu-rw-panel" style="display:none;">
    <div class="fiyuu-rw-panel-header">
      <div class="fiyuu-rw-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Responsive Preview
        <span class="fiyuu-rw-preset-badge">${escapeHtml(preset)}</span>
      </div>
      <button type="button" class="fiyuu-rw-close" onclick="window.__fiyuu_rw_close('${wrapperId}')" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="fiyuu-rw-toolbar">
      <button type="button" class="fiyuu-rw-mode-btn" data-mode="mobile" onclick="window.__fiyuu_rw_setmode('${wrapperId}','mobile')">Mobil</button>
      <button type="button" class="fiyuu-rw-mode-btn" data-mode="desktop" onclick="window.__fiyuu_rw_setmode('${wrapperId}','desktop')">Desktop</button>
      <button type="button" class="fiyuu-rw-mode-btn active" data-mode="both" onclick="window.__fiyuu_rw_setmode('${wrapperId}','both')">Mobil + Desktop</button>
    </div>

    <div class="fiyuu-rw-toolbar fiyuu-rw-device-bar">
      <button type="button" class="fiyuu-rw-dev-btn active" data-device="phone" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','phone')">${phoneDevice.icon} iPhone (${phoneDevice.width}px)</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="tablet" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','tablet')">${tabletDevice.icon} iPad (${tabletDevice.width}px)</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="watch" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','watch')">${watchDevice.icon} Watch (${watchDevice.width}px)</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="desktop" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','desktop')">${desktopDevice.icon} Desktop (${desktopDevice.width}px)</button>
    </div>

    <div class="fiyuu-rw-viewport">
      <!-- Mobile View -->
      <div id="${wrapperId}-mobile-view" class="fiyuu-rw-device-col" style="display:none;">
        <div class="fiyuu-rw-device-frame fiyuu-rw-phone-frame">
          <div class="fiyuu-rw-phone-notch"></div>
          <div class="fiyuu-rw-device-screen" style="width:${phoneDevice.width}px;height:${phoneDevice.height}px;transform:scale(${phoneDevice.scale});transform-origin:top center;">
            ${content}
          </div>
          <div class="fiyuu-rw-phone-home"></div>
        </div>
        <div class="fiyuu-rw-device-info">${phoneDevice.icon} ${phoneDevice.label} — ${phoneDevice.width}px</div>
      </div>

      <!-- Desktop View -->
      <div id="${wrapperId}-desktop-view" class="fiyuu-rw-device-col" style="display:none;">
        <div class="fiyuu-rw-device-frame fiyuu-rw-desktop-frame">
          <div class="fiyuu-rw-desktop-toolbar">
            <span class="fiyuu-rw-dot" style="background:#FF5F57;"></span>
            <span class="fiyuu-rw-dot" style="background:#FEBC2E;"></span>
            <span class="fiyuu-rw-dot" style="background:#28C840;"></span>
            <span class="fiyuu-rw-url-bar">${"localhost".padEnd(42, " ")}</span>
          </div>
          <div class="fiyuu-rw-device-screen" style="width:${desktopDevice.width}px;height:${desktopDevice.height}px;transform:scale(${desktopDevice.scale});transform-origin:top center;">
            ${content}
          </div>
        </div>
        <div class="fiyuu-rw-device-info">${desktopDevice.icon} ${desktopDevice.label} — ${desktopDevice.width}px</div>
      </div>
    </div>
  </div>`;
}

function buildPreviewStyles(): string {
  return `<style id="fiyuu-rw-styles">
.fiyuu-responsive-wrapper{position:relative;width:100%;box-sizing:border-box;}

/* Preview Button */
.fiyuu-rw-btn{position:absolute;top:8px;right:8px;z-index:50;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;border:1px solid var(--border,#e5e7eb);background:var(--bg-primary,#fff);color:var(--text-muted,#9ca3af);font-size:11px;font-weight:600;font-family:var(--font-sans,var(--font-merriweather,system-ui),sans-serif);cursor:pointer;opacity:0.5;transition:all .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.08);letter-spacing:.01em;}
.fiyuu-rw-btn:hover{opacity:1;border-color:var(--accent,#ca6242);color:var(--accent,#ca6242);}
.fiyuu-rw-btn svg{flex-shrink:0;}

/* Panel */
.fiyuu-rw-panel{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);display:flex;flex-direction:column;animation:fiyuu-rw-fade .18s ease;}
@keyframes fiyuu-rw-fade{from{opacity:0}to{opacity:1}}

/* Panel Header */
.fiyuu-rw-panel-header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--bg-primary,#fff);border-bottom:1px solid var(--border,#e5e7eb);flex-shrink:0;}
.fiyuu-rw-panel-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--text-primary,#111827);font-family:var(--font-sans,var(--font-merriweather,system-ui),sans-serif);}
.fiyuu-rw-preset-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent,#ca6242);background:rgba(202,98,66,.1);padding:2px 8px;border-radius:6px;}
.fiyuu-rw-close{background:none;border:none;color:var(--text-muted,#9ca3af);cursor:pointer;padding:6px;border-radius:8px;display:flex;align-items:center;transition:all .15s;}
.fiyuu-rw-close:hover{background:var(--bg-secondary,#f3f4f6);color:var(--text-primary,#111827);}

/* Toolbar */
.fiyuu-rw-toolbar{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;background:var(--bg-primary,#fff);border-bottom:1px solid var(--border,#e5e7eb);flex-shrink:0;}
.fiyuu-rw-device-bar{border-bottom:none;gap:4px;padding:6px 20px 10px;}
.fiyuu-rw-mode-btn{padding:6px 16px;border-radius:8px;border:1px solid var(--border,#e5e7eb);background:var(--bg-primary,#fff);color:var(--text-secondary,#4b5563);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
.fiyuu-rw-mode-btn:hover{border-color:var(--accent,#ca6242);color:var(--accent,#ca6242);}
.fiyuu-rw-mode-btn.active{background:var(--accent,#ca6242);color:white;border-color:var(--accent,#ca6242);}
.fiyuu-rw-dev-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;border:1px solid var(--border,#e5e7eb);background:var(--bg-primary,#fff);color:var(--text-muted,#9ca3af);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;}
.fiyuu-rw-dev-btn:hover{border-color:var(--accent,#ca6242);color:var(--accent,#ca6242);}
.fiyuu-rw-dev-btn.active{background:var(--bg-secondary,#f3f4f6);color:var(--text-primary,#111827);border-color:var(--accent,#ca6242);}

/* Viewport */
.fiyuu-rw-viewport{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;gap:32px;padding:32px 20px;}
.fiyuu-rw-device-col{display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}
.fiyuu-rw-device-info{font-size:11px;font-weight:600;color:var(--text-muted,#9ca3af);display:flex;align-items:center;gap:5px;font-family:inherit;}
.fiyuu-rw-device-frame{background:#111;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.fiyuu-rw-device-screen{background:var(--bg-primary,#fff);overflow:auto;transform-origin:top left;}

/* Phone Frame */
.fiyuu-rw-phone-frame{border-radius:36px;padding:12px 6px 16px;position:relative;}
.fiyuu-rw-phone-frame .fiyuu-rw-device-screen{border-radius:4px;}
.fiyuu-rw-phone-notch{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:80px;height:22px;background:#111;border-radius:0 0 14px 14px;z-index:10;}
.fiyuu-rw-phone-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:80px;height:4px;background:rgba(255,255,255,.25);border-radius:2px;}

/* Desktop Frame */
.fiyuu-rw-desktop-frame{border-radius:10px;border:1px solid #2a2a2e;}
.fiyuu-rw-desktop-toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#1a1a1d;border-bottom:1px solid #2a2a2e;}
.fiyuu-rw-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.fiyuu-rw-url-bar{flex:1;margin-left:8px;background:#0f0f10;border:1px solid #2a2a2e;border-radius:6px;padding:3px 10px;font-size:10px;color:#6b7280;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

@media(max-width:900px){.fiyuu-rw-viewport{flex-direction:column;align-items:center;padding:16px 10px;gap:20px;}.fiyuu-rw-device-frame{transform:scale(0.8);transform-origin:top center;}.fiyuu-rw-device-bar{flex-wrap:wrap;justify-content:center;}.fiyuu-rw-toolbar{flex-wrap:wrap;}}
@media(max-width:600px){.fiyuu-rw-panel-header{padding:10px 14px;}.fiyuu-rw-toolbar{padding:8px 12px;gap:4px;}.fiyuu-rw-viewport{padding:12px 8px;}}
  </style>`;
}

export function responsiveWrapperScript(): string {
  return `<script>
(function(){
  if (window.__fiyuu_rw_open) return;
  window.__fiyuu_rw_open = function(id) {
    var el = document.getElementById(id + "-panel");
    if (!el) return;
    el.style.display = "flex";
    document.body.style.overflow = "hidden";
    window.__fiyuu_rw_setmode(id, "both");
    window.__fiyuu_rw_setdevice(id, "phone");
  };
  window.__fiyuu_rw_close = function(id) {
    var el = document.getElementById(id + "-panel");
    if (!el) return;
    el.style.display = "none";
    document.body.style.overflow = "";
  };
  window.__fiyuu_rw_setmode = function(id, mode) {
    var mobile = document.getElementById(id + "-mobile-view");
    var desktop = document.getElementById(id + "-desktop-view");
    if (!mobile || !desktop) return;
    mobile.style.display = (mode === "mobile" || mode === "both") ? "flex" : "none";
    desktop.style.display = (mode === "desktop" || mode === "both") ? "flex" : "none";
    var panel = document.getElementById(id + "-panel");
    if (!panel) return;
    panel.querySelectorAll(".fiyuu-rw-mode-btn").forEach(function(btn) {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });
  };
  window.__fiyuu_rw_setdevice = function(id, device) {
    var panel = document.getElementById(id + "-panel");
    if (!panel) return;
    panel.querySelectorAll(".fiyuu-rw-dev-btn").forEach(function(btn) {
      btn.classList.toggle("active", btn.getAttribute("data-device") === device);
    });
    var mobileView = document.getElementById(id + "-mobile-view");
    if (mobileView) {
      var screen = mobileView.querySelector(".fiyuu-rw-device-screen");
      if (screen) {
        var sizes = { phone: { w: 375, h: 812, s: 0.55 }, tablet: { w: 768, h: 1024, s: 0.42 }, watch: { w: 200, h: 240, s: 0.65 }, desktop: { w: 1280, h: 800, s: 0.38 } };
        var size = sizes[device] || sizes.phone;
        screen.style.width = size.w + "px";
        screen.style.height = size.h + "px";
        screen.style.transform = "scale(" + size.s + ")";
      }
      var frame = mobileView.querySelector(".fiyuu-rw-phone-frame");
      if (frame && device === "tablet") {
        frame.classList.remove("fiyuu-rw-phone-frame");
        frame.classList.add("fiyuu-rw-desktop-frame");
        frame.style.borderRadius = "10px";
        frame.style.padding = "0";
        var tb = frame.querySelector(".fiyuu-rw-phone-notch");
        if (tb) tb.style.display = "none";
        var th = frame.querySelector(".fiyuu-rw-phone-home");
        if (th) th.style.display = "none";
        var toolbar = document.createElement("div");
        toolbar.className = "fiyuu-rw-desktop-toolbar";
        toolbar.innerHTML = '<span class="fiyuu-rw-dot" style="background:#FF5F57;"></span><span class="fiyuu-rw-dot" style="background:#FEBC2E;"></span><span class="fiyuu-rw-dot" style="background:#28C840;"></span>';
        if (!frame.querySelector(".fiyuu-rw-desktop-toolbar")) frame.insertBefore(toolbar, frame.firstChild);
      } else if (frame) {
        frame.classList.add("fiyuu-rw-phone-frame");
        frame.classList.remove("fiyuu-rw-desktop-frame");
        frame.style.borderRadius = "";
        frame.style.padding = "";
        var tb2 = frame.querySelector(".fiyuu-rw-phone-notch");
        if (tb2) tb2.style.display = "";
        var th2 = frame.querySelector(".fiyuu-rw-phone-home");
        if (th2) th2.style.display = "";
        var tb3 = frame.querySelector(".fiyuu-rw-desktop-toolbar");
        if (tb3) tb3.remove();
      }
    }
  };
})();
</script>`;
}
