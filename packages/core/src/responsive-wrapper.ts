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
    width: 390,
    height: 844,
    label: "iPhone",
    scale: 0.72,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
  },
  tablet: {
    width: 768,
    height: 1024,
    label: "iPad",
    scale: 0.56,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
  },
  watch: {
    width: 200,
    height: 240,
    label: "Watch",
    scale: 0.85,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px"><rect x="6" y="5" width="12" height="14" rx="3"/><path d="M12 12h.01M9 5V3M15 5V3M9 19v2M15 19v2"/></svg>',
  },
  desktop: {
    width: 1280,
    height: 800,
    label: "Desktop",
    scale: 0.52,
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

  const centerStyle = maxWidth > 0 ? "margin-left:auto;margin-right:auto;" : "";
  return `<div id="${wrapperId}" class="fiyuu-responsive-wrapper ${containerClass}" style="position:relative;width:100%;${widthStyle}${centerStyle}${paddingStyle}${customStyle}">${previewButton}${content}${previewPanel}</div>${previewStyles}`;
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

  // Scale wrappers clip to actual visual size so height matches
  const phoneW = Math.round(phoneDevice.width * phoneDevice.scale);
  const phoneH = Math.round(phoneDevice.height * phoneDevice.scale);
  const desktopW = Math.round(desktopDevice.width * desktopDevice.scale);
  const desktopH = Math.round(desktopDevice.height * desktopDevice.scale);

  return `<div id="${wrapperId}-panel" class="fiyuu-rw-panel" style="display:none;">
    <!-- Left float sidebar -->
    <div class="fiyuu-rw-sidebar">
      <button type="button" class="fiyuu-rw-close" onclick="window.__fiyuu_rw_close('${wrapperId}')" aria-label="Close" title="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <span class="fiyuu-rw-preset-badge">${escapeHtml(preset)}</span>
      <div class="fiyuu-rw-sidebar-divider"></div>
      <span class="fiyuu-rw-sidebar-label">VIEW</span>
      <button type="button" class="fiyuu-rw-mode-btn" data-mode="mobile" onclick="window.__fiyuu_rw_setmode('${wrapperId}','mobile')" title="Mobile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
        <span>Mobile</span>
      </button>
      <button type="button" class="fiyuu-rw-mode-btn" data-mode="desktop" onclick="window.__fiyuu_rw_setmode('${wrapperId}','desktop')" title="Desktop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        <span>Desktop</span>
      </button>
      <button type="button" class="fiyuu-rw-mode-btn active" data-mode="both" onclick="window.__fiyuu_rw_setmode('${wrapperId}','both')" title="Both">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><rect x="1" y="7" width="9" height="13" rx="1"/><rect x="14" y="4" width="9" height="13" rx="1"/></svg>
        <span>Both</span>
      </button>
      <div class="fiyuu-rw-sidebar-divider"></div>
      <span class="fiyuu-rw-sidebar-label">DEVICE</span>
      <button type="button" class="fiyuu-rw-dev-btn active" data-device="phone" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','phone')" title="iPhone (375px)">${phoneDevice.icon}</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="tablet" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','tablet')" title="iPad (768px)">${tabletDevice.icon}</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="watch" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','watch')" title="Watch (200px)">${watchDevice.icon}</button>
      <button type="button" class="fiyuu-rw-dev-btn" data-device="desktop" onclick="window.__fiyuu_rw_setdevice('${wrapperId}','desktop')" title="Desktop (1280px)">${desktopDevice.icon}</button>
    </div>

    <!-- Viewport area -->
    <div class="fiyuu-rw-viewport">
      <!-- Mobile View -->
      <div id="${wrapperId}-mobile-view" class="fiyuu-rw-device-col" style="display:none;">
        <div class="fiyuu-rw-device-frame fiyuu-rw-phone-frame">
          <div class="fiyuu-rw-phone-notch"></div>
          <div class="fiyuu-rw-screen-wrapper" id="${wrapperId}-mobile-screen-wrapper" style="width:${phoneW}px;height:${phoneH}px;">
            <div class="fiyuu-rw-device-screen" style="width:${phoneDevice.width}px;height:${phoneDevice.height}px;transform:scale(${phoneDevice.scale});transform-origin:top left;">
              ${content}
            </div>
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
          <div class="fiyuu-rw-screen-wrapper" style="width:${desktopW}px;height:${desktopH}px;">
            <div class="fiyuu-rw-device-screen" style="width:${desktopDevice.width}px;height:${desktopDevice.height}px;transform:scale(${desktopDevice.scale});transform-origin:top left;">
              ${content}
            </div>
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

/* Preview Button (FAB) */
.fiyuu-rw-btn{position:fixed;bottom:24px;right:24px;z-index:999;display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:12px;border:none;background:var(--accent,#ca6242);color:white;font-size:12px;font-weight:600;font-family:var(--font-sans,system-ui,sans-serif);cursor:pointer;opacity:0.9;transition:all .2s ease;box-shadow:0 4px 16px rgba(0,0,0,.15);letter-spacing:.01em;}
.fiyuu-rw-btn:hover{opacity:1;transform:scale(1.05);box-shadow:0 6px 24px rgba(0,0,0,.2);}
.fiyuu-rw-btn svg{flex-shrink:0;}

/* Panel — row: sidebar + viewport */
.fiyuu-rw-panel{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);display:flex;flex-direction:row;animation:fiyuu-rw-fade .18s ease;}
@keyframes fiyuu-rw-fade{from{opacity:0}to{opacity:1}}

/* Left Sidebar */
.fiyuu-rw-sidebar{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;background:var(--bg-primary,#fff);border-right:1px solid var(--border,#e5e7eb);width:76px;flex-shrink:0;overflow-y:auto;}
.fiyuu-rw-close{background:none;border:none;color:var(--text-muted,#9ca3af);cursor:pointer;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;width:36px;height:36px;transition:all .15s;flex-shrink:0;}
.fiyuu-rw-close:hover{background:var(--bg-secondary,#f3f4f6);color:var(--text-primary,#111827);}
.fiyuu-rw-preset-badge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--accent,#ca6242);background:rgba(202,98,66,.1);padding:3px 6px;border-radius:6px;text-align:center;word-break:break-all;line-height:1.3;}
.fiyuu-rw-sidebar-divider{width:80%;height:1px;background:var(--border,#e5e7eb);margin:4px 0;flex-shrink:0;}
.fiyuu-rw-sidebar-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted,#9ca3af);font-family:var(--font-sans,system-ui);}

/* Mode buttons — vertical pill blob */
.fiyuu-rw-mode-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 6px;border-radius:999px;border:none;background:var(--bg-secondary,#f3f4f6);color:var(--text-secondary,#4b5563);font-size:9px;font-weight:700;cursor:pointer;font-family:var(--font-sans,system-ui);transition:all .15s;width:56px;text-align:center;flex-shrink:0;}
.fiyuu-rw-mode-btn span{line-height:1.2;}
.fiyuu-rw-mode-btn:hover{background:rgba(202,98,66,.12);color:var(--accent,#ca6242);}
.fiyuu-rw-mode-btn.active{background:var(--accent,#ca6242);color:white;}

/* Device buttons — circle blob icon-only */
.fiyuu-rw-dev-btn{display:flex;align-items:center;justify-content:center;padding:0;border-radius:999px;border:none;background:var(--bg-secondary,#f3f4f6);color:var(--text-muted,#9ca3af);cursor:pointer;transition:all .15s;width:40px;height:40px;flex-shrink:0;}
.fiyuu-rw-dev-btn:hover{background:rgba(202,98,66,.12);color:var(--accent,#ca6242);}
.fiyuu-rw-dev-btn.active{background:var(--accent,#ca6242);color:white;}

/* Viewport */
.fiyuu-rw-viewport{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;gap:32px;padding:32px 24px;}
.fiyuu-rw-device-col{display:flex;flex-direction:column;align-items:center;gap:12px;flex-shrink:0;}
.fiyuu-rw-device-info{font-size:11px;font-weight:600;color:var(--text-muted,#9ca3af);display:flex;align-items:center;gap:5px;font-family:var(--font-sans,system-ui);}

/* Device Frame */
.fiyuu-rw-device-frame{background:#111;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);}

/* Screen wrapper clips to actual scaled dimensions */
.fiyuu-rw-screen-wrapper{position:relative;overflow:hidden;flex-shrink:0;}
.fiyuu-rw-device-screen{background:var(--bg-primary,#fff);overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;position:absolute;top:0;left:0;}

/* Phone Frame */
.fiyuu-rw-phone-frame{border-radius:36px;padding:28px 8px 20px;position:relative;}
.fiyuu-rw-phone-notch{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:72px;height:20px;background:#111;border-radius:0 0 14px 14px;z-index:10;}
.fiyuu-rw-phone-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:72px;height:4px;background:rgba(255,255,255,.25);border-radius:2px;}

/* Desktop Frame */
.fiyuu-rw-desktop-frame{border-radius:10px;border:1px solid #2a2a2e;}
.fiyuu-rw-desktop-toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#1a1a1d;border-bottom:1px solid #2a2a2e;}
.fiyuu-rw-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.fiyuu-rw-url-bar{flex:1;margin-left:8px;background:#0f0f10;border:1px solid #2a2a2e;border-radius:6px;padding:3px 10px;font-size:10px;color:#6b7280;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

@media(max-width:900px){.fiyuu-rw-viewport{flex-direction:column;align-items:center;padding:20px 12px;gap:24px;}}
@media(max-width:600px){.fiyuu-rw-sidebar{width:56px;padding:10px 6px;gap:4px;}.fiyuu-rw-mode-btn{width:44px;font-size:8px;padding:7px 4px;}.fiyuu-rw-dev-btn{width:36px;height:36px;}.fiyuu-rw-viewport{padding:16px 8px;gap:16px;}}
@media(max-width:480px){.fiyuu-rw-mode-btn span{display:none;}.fiyuu-rw-mode-btn{padding:8px;gap:0;width:40px;height:40px;}.fiyuu-rw-viewport{padding:10px 6px;}}
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
    var mode = window.innerWidth < 600 ? "mobile" : "both";
    window.__fiyuu_rw_setmode(id, mode);
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
      var wrapper = mobileView.querySelector(".fiyuu-rw-screen-wrapper");
      var sizes = { phone: { w: 390, h: 844, s: 0.72 }, tablet: { w: 768, h: 1024, s: 0.56 }, watch: { w: 200, h: 240, s: 0.85 }, desktop: { w: 1280, h: 800, s: 0.52 } };
      var size = sizes[device] || sizes.phone;
      if (screen) {
        screen.style.width = size.w + "px";
        screen.style.height = size.h + "px";
        screen.style.transform = "scale(" + size.s + ")";
      }
      if (wrapper) {
        wrapper.style.width = Math.round(size.w * size.s) + "px";
        wrapper.style.height = Math.round(size.h * size.s) + "px";
      }
      var frame = mobileView.querySelector(".fiyuu-rw-device-frame");
      if (frame) {
        if (device === "tablet" || device === "desktop") {
          frame.className = "fiyuu-rw-device-frame fiyuu-rw-desktop-frame";
          var notch = frame.querySelector(".fiyuu-rw-phone-notch");
          if (notch) notch.style.display = "none";
          var home = frame.querySelector(".fiyuu-rw-phone-home");
          if (home) home.style.display = "none";
          if (!frame.querySelector(".fiyuu-rw-desktop-toolbar")) {
            var tb = document.createElement("div");
            tb.className = "fiyuu-rw-desktop-toolbar";
            tb.innerHTML = '<span class="fiyuu-rw-dot" style="background:#FF5F57;"></span><span class="fiyuu-rw-dot" style="background:#FEBC2E;"></span><span class="fiyuu-rw-dot" style="background:#28C840;"></span>';
            frame.insertBefore(tb, frame.firstChild);
          }
        } else {
          frame.className = "fiyuu-rw-device-frame fiyuu-rw-phone-frame";
          var notch2 = frame.querySelector(".fiyuu-rw-phone-notch");
          if (notch2) notch2.style.display = "";
          var home2 = frame.querySelector(".fiyuu-rw-phone-home");
          if (home2) home2.style.display = "";
          var dtb = frame.querySelector(".fiyuu-rw-desktop-toolbar");
          if (dtb) dtb.remove();
        }
      }
    }
  };
})();
</script>`;
}
