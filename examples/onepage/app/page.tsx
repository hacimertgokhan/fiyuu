import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, responsiveWrapper } from "@fiyuu/core/client";

export const page = definePage({ intent: "OnePage landing with ResponsiveWrapper demo" });

export default class OnePage extends Component {
  template() {
    var data = (this.props && this.props.data) || {};
    var site = data.site || { name: "Fiyuu", tagline: "Always-Live Fullstack Framework", description: "Hafif, hizli ve developer-friendly." };
    var features = data.features || [];
    var plans = data.plans || [];
    var stats = data.stats || [];
    var testimonials = data.testimonials || [];
    var subscriberCount = data.subscriberCount || 0;

    var iconCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;"><path d="M20 6 9 17l-5-5"/></svg>';
    var iconZap = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
    var iconDatabase = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>';
    var iconLayers = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><path d="m12 2 9 4.5-9 4.5-9-4.5L12 2z"/><path d="m12 11 9 4.5-9 4.5-9-4.5L12 11z"/><path d="m12 20 9 4.5-9 4.5-9-4.5L12 20z"/></svg>';
    var iconSmartphone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>';
    var iconShield = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    var iconCpu = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:24px;height:24px;"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>';
    var iconStar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="m12 3.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.6l-5.6 2.9 1.1-6.1L3 10.1l6.2-.9z"/></svg>';
    var iconArrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    var iconMoon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px;"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
    var iconQuote = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;color:var(--accent);opacity:0.3;"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.235 0-2.32-.61-2.917-1.531l-1.792 1.542zM14.583 17.321C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.235 0-2.32-.61-2.917-1.531l-1.792 1.542z"/></svg>';
    var iconEye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    var iconGithub = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>';
    var iconArrowRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    var featureIcons = {
      database: iconDatabase,
      zap: iconZap,
      layers: iconLayers,
      smartphone: iconSmartphone,
      shield: iconShield,
      cpu: iconCpu,
    };

    function buildFeaturesHtml(items) {
      var h = "";
      for (var i = 0; i < items.length; i++) {
        var f = items[i];
        h += '<div class="feature-card" style="animation-delay:' + (i * 80) + 'ms;">'
          + '<div class="feature-icon" style="background:' + f.color + '15;color:' + f.color + ';">' + (featureIcons[f.icon] || "") + '</div>'
          + '<h3>' + escapeHtml(f.title) + '</h3>'
          + '<p>' + escapeHtml(f.description) + '</p>'
          + '</div>';
      }
      return h;
    }

    function buildPlansHtml(items) {
      var h = "";
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var cls = p.highlighted ? "plan-card plan-highlighted" : "plan-card";
        var titleColor = p.highlighted ? "color:white;" : "";
        var priceColor = p.highlighted ? "color:white;" : "";
        var periodColor = p.highlighted ? "color:rgba(255,255,255,0.7);" : "";
        var btnCls = p.highlighted ? "btn-primary" : "btn-outline";
        var btnStyle = p.highlighted ? "background:white;color:var(--accent);border-color:white;" : "";

        var feats = "";
        for (var j = 0; j < p.features.length; j++) {
          feats += '<div class="plan-feature">' + iconCheck + '<span>' + escapeHtml(p.features[j]) + '</span></div>';
        }

        h += '<div class="' + cls + '" style="animation-delay:' + (i * 100) + 'ms;">'
          + '<h3 style="' + titleColor + '">' + escapeHtml(p.name) + '</h3>'
          + '<div class="plan-price"><span style="' + priceColor + '">' + escapeHtml(p.price) + '</span><span style="' + periodColor + '">' + escapeHtml(p.period) + '</span></div>'
          + '<div class="plan-features">' + feats + '</div>'
          + '<button class="' + btnCls + '" style="width:100%;justify-content:center;' + btnStyle + '">' + (p.highlighted ? "Basla" : "Iletisime Gec") + '</button>'
          + '</div>';
      }
      return h;
    }

    function buildTestimonialsHtml(items) {
      var h = "";
      for (var i = 0; i < items.length; i++) {
        var t = items[i];
        h += '<div class="testimonial-card" style="animation-delay:' + (i * 100) + 'ms;">'
          + '<div class="testimonial-quote">' + iconQuote + '</div>'
          + '<p class="testimonial-text">"' + escapeHtml(t.text) + '"</p>'
          + '<div class="testimonial-author">'
          + '<div class="testimonial-avatar">' + escapeHtml(t.avatar) + '</div>'
          + '<div><div class="testimonial-name">' + escapeHtml(t.name) + '</div><div class="testimonial-role">' + escapeHtml(t.role) + '</div></div>'
          + '</div>'
          + '</div>';
      }
      return h;
    }

    function buildStatsHtml(items) {
      var h = "";
      for (var i = 0; i < items.length; i++) {
        var s = items[i];
        h += '<div class="stat-item" style="animation-delay:' + (i * 100) + 'ms;">'
          + '<div class="stat-value">' + escapeHtml(s.value) + '</div>'
          + '<div class="stat-label">' + escapeHtml(s.label) + '</div>'
          + '</div>';
      }
      return h;
    }

    var featuresHtml = responsiveWrapper({
      preset: "dashboard",
      previewEnabled: true,
      previewLabel: "Preview",
      id: "features-preview",
      content: '<section id="features" class="section" data-observe>'
        + '<div class="section-header">'
        + '<div class="section-label">' + iconZap + ' Ozellikler</div>'
        + '<h2 class="section-title">Fullstack, hafif ve guclu</h2>'
        + '<p class="section-subtitle">Fiyuu ile modern web uygulamalari olusturmak hic bu kadar kolay olmamisti.</p>'
        + '</div>'
        + '<div class="features-grid">' + buildFeaturesHtml(features) + '</div>'
        + '</section>',
    });

    var pricingHtml = responsiveWrapper({
      preset: "dashboard",
      previewEnabled: true,
      previewLabel: "Preview",
      id: "pricing-preview",
      content: '<section id="pricing" class="section" data-observe>'
        + '<div class="section-header">'
        + '<div class="section-label">' + iconDatabase + ' Fiyatlandirma</div>'
        + '<h2 class="section-title">Basit ve seffaf fiyatlar</h2>'
        + '</div>'
        + '<div class="plans-grid">' + buildPlansHtml(plans) + '</div>'
        + '</section>',
    });

    var testimonialsHtml = responsiveWrapper({
      preset: "dashboard",
      previewEnabled: true,
      previewLabel: "Preview",
      id: "testimonials-preview",
      content: '<section id="testimonials" class="section section-alt" data-observe>'
        + '<div class="section-header">'
        + '<div class="section-label">' + iconStar + ' Yorumlar</div>'
        + '<h2 class="section-title">Gelistiriciler ne diyor?</h2>'
        + '</div>'
        + '<div class="testimonials-grid">' + buildTestimonialsHtml(testimonials) + '</div>'
        + '</section>',
    });

    var contactHtml = responsiveWrapper({
      preset: "dashboard",
      previewEnabled: true,
      previewLabel: "Preview",
      id: "contact-preview",
      content: '<section id="contact" class="section" data-observe>'
        + '<div class="contact-grid">'
        + '<div>'
        + '<div class="section-label">Iletisim</div>'
        + '<h2 class="section-title">Haberdar olun</h2>'
        + '<p class="section-subtitle" style="margin-bottom:1.5rem;">FiyuuUpdates abonesi olarak yeni ozelliklerden ilk siz haberdar olun.</p>'
        + '<div class="subscriber-count">' + iconCheck + '<span>' + subscriberCount + '+ abone</span></div>'
        + '</div>'
        + '<div class="contact-form">'
        + '<h3>Newsletter Aboneligi</h3>'
        + '<div class="form-row">'
        + '<input type="email" id="sub-email" placeholder="email@example.com" />'
        + '<button type="button" id="sub-btn" class="btn-primary">Abone Ol</button>'
        + '</div>'
        + '<p id="sub-status" class="form-status"></p>'
        + '<div class="form-divider"></div>'
        + '<h4>Veya mesaj gonderin</h4>'
        + '<input type="text" id="contact-name" placeholder="Adiniz" />'
        + '<textarea id="contact-message" placeholder="Mesajiniz..." rows="3"></textarea>'
        + '<button type="button" id="contact-btn" class="btn-outline" style="width:100%;justify-content:center;">Gonder</button>'
        + '<p id="contact-status" class="form-status"></p>'
        + '</div>'
        + '</div>'
        + '</section>',
    });

    return html`
      <style>
        .section { padding: 5rem 1.5rem; max-width: 72rem; margin: 0 auto; }
        .section-alt { background: var(--bg-secondary); max-width: 100%; padding-left: calc((100% - 72rem) / 2 + 1.5rem); padding-right: calc((100% - 72rem) / 2 + 1.5rem); }
        @media (max-width: 768px) { .section, .section-alt { padding: 3rem 1rem; } }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-label { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin-bottom: 0.75rem; font-family: var(--font-sans); }
        .section-title { font-family: var(--font-serif); font-size: 2.25rem; font-weight: 900; color: var(--text-primary); line-height: 1.2; margin-bottom: 1rem; }
        @media (max-width: 768px) { .section-title { font-size: 1.75rem; } }
        .section-subtitle { font-family: var(--font-sans); font-size: 1.125rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto; line-height: 1.7; }

        .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent); color: white; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); text-decoration: none; }
        .btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-outline { display: inline-flex; align-items: center; gap: 0.5rem; background: transparent; color: var(--text-primary); border: 2px solid var(--border); border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); text-decoration: none; }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        @media (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr; } }
        .feature-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 1.75rem; }
        .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
        .feature-card h3 { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
        .feature-card p { font-family: var(--font-sans); font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7; }

        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; align-items: start; }
        @media (max-width: 1024px) { .plans-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .plans-grid { grid-template-columns: 1fr; } }
        .plan-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
        .plan-highlighted { background: var(--accent); border-color: transparent; transform: scale(1.05); }
        .plan-card h3 { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
        .plan-price { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 1.5rem; }
        .plan-price span:first-child { font-family: var(--font-sans); font-size: 2.5rem; font-weight: 900; color: var(--text-primary); }
        .plan-price span:last-child { font-family: var(--font-sans); font-size: 0.875rem; color: var(--text-muted); }
        .plan-features { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .plan-feature { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-sans); font-size: 0.875rem; color: var(--text-secondary); }
        .plan-feature span:first-child { color: var(--accent); }

        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        @media (max-width: 1024px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 16px; padding: 1.75rem; }
        .testimonial-quote { margin-bottom: 1rem; }
        .testimonial-text { font-family: var(--font-serif); font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.75; margin-bottom: 1.5rem; }
        .testimonial-author { display: flex; align-items: center; gap: 0.75rem; }
        .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
        .testimonial-name { font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
        .testimonial-role { font-family: var(--font-sans); font-size: 0.75rem; color: var(--text-muted); }

        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }
        .subscriber-count { display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-family: var(--font-sans); font-size: 0.875rem; }
        .contact-form { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; }
        .contact-form h3 { font-family: var(--font-serif); font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; }
        .contact-form h4 { font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem; }
        .form-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
        .form-row input { flex: 1; }
        .contact-form input, .contact-form textarea {
          width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem 1rem; color: var(--text-primary); font-family: var(--font-sans); font-size: 0.875rem; outline: none;
        }
        .contact-form input:focus, .contact-form textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .contact-form textarea { resize: vertical; margin-bottom: 0.75rem; }
        .contact-form textarea { min-height: 80px; }
        .form-divider { border-top: 1px solid var(--border); margin: 1.5rem 0; padding-top: 1.5rem; }
        .form-status { font-size: 0.8125rem; color: var(--accent); margin-top: 0.5rem; display: none; }

        .notif-toast { position: fixed; top: 1.5rem; right: 1.5rem; background: var(--bg-primary); border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 12px; padding: 1rem 1.25rem; box-shadow: 0 12px 40px rgba(0,0,0,0.15); z-index: 10000; max-width: 340px; display: none; }
        .notif-toast.show { display: block; }

        .hero-section { padding: 4rem 0 3rem; text-align: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--accent-light); color: var(--accent); font-family: var(--font-sans); font-size: 0.75rem; font-weight: 700; padding: 0.375rem 1rem; border-radius: 999px; margin-bottom: 1.5rem; letter-spacing: 0.04em; }
        .hero-title { font-family: var(--font-serif); font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem; color: var(--text-primary); }
        .hero-subtitle { font-family: var(--font-sans); font-size: 1.25rem; color: var(--text-secondary); max-width: 640px; margin: 0 auto 2rem; line-height: 1.7; }
        .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .hero-stats { display: flex; gap: 2rem; justify-content: center; margin-top: 3rem; flex-wrap: wrap; }
        @media (max-width: 768px) { .hero-title { font-size: 2.25rem; } .hero-section { padding: 2rem 1rem 2rem; } }
      </style>

      <!-- NAV -->
      <nav style="position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);">
        <div style="max-width:72rem;margin:0 auto;padding:0.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
          <a href="#" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none;color:var(--text-primary);font-weight:800;font-size:1.25rem;">
            <span style="width:32px;height:32px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:900;">Fi</span>
            ${escapeHtml(site.name)}
          </a>
          <div style="display:flex;align-items:center;gap:1.5rem;">
            <a href="#features" style="color:var(--text-secondary);text-decoration:none;font-family:var(--font-sans);font-size:0.875rem;font-weight:500;">Ozellikler</a>
            <a href="#pricing" style="color:var(--text-secondary);text-decoration:none;font-family:var(--font-sans);font-size:0.875rem;font-weight:500;">Fiyatlar</a>
            <a href="#testimonials" style="color:var(--text-secondary);text-decoration:none;font-family:var(--font-sans);font-size:0.875rem;font-weight:500;">Yorumlar</a>
            <a href="#contact" style="color:var(--text-secondary);text-decoration:none;font-family:var(--font-sans);font-size:0.875rem;font-weight:500;">Iletisim</a>
            <button type="button" data-theme-toggle style="background:none;border:1px solid var(--border);border-radius:8px;padding:0.375rem;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;">${iconMoon}</button>
          </div>
        </div>
      </nav>
      <div style="height:60px;"></div>

      <!-- HERO -->
      ${responsiveWrapper({
        preset: "dashboard",
        previewEnabled: true,
        previewLabel: "Preview",
        id: "hero-preview",
        content: '<section class="hero-section anim-up">'
          + '<div class="hero-badge">' + iconZap + ' Always-Live Framework</div>'
          + '<h1 class="hero-title">' + escapeHtml(site.tagline) + '</h1>'
          + '<p class="hero-subtitle">' + escapeHtml(site.description) + '</p>'
          + '<div class="hero-actions">'
          + '<a href="#contact" class="btn-primary" style="font-size:1rem;padding:0.875rem 2rem;">Hemen Basla ' + iconArrow + '</a>'
          + '<a href="https://github.com/hacimertgokhan/fiyuu" class="btn-outline" style="font-size:1rem;padding:0.875rem 2rem;">' + iconGithub + ' GitHub</a>'
          + '</div>'
          + '<div class="hero-stats">' + buildStatsHtml(stats) + '</div>'
          + '</section>',
      })}

      ${featuresHtml}
      ${pricingHtml}
      ${testimonialsHtml}
      ${contactHtml}

      <!-- FOOTER -->
      <footer style="border-top:1px solid var(--border);padding:2rem 0;text-align:center;">
        <p style="font-family:var(--font-sans);font-size:0.875rem;color:var(--text-muted);">Built with <a href="https://github.com/hacimertgokhan/fiyuu" style="color:var(--accent);text-decoration:none;font-weight:600;">Fiyuu</a> - Always-live fullstack framework</p>
        <p style="font-family:var(--font-sans);font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;opacity:0.6;">ResponsiveWrapper ile gelistirildi. Sag ustteki <span style="display:inline-flex;vertical-align:middle;">${iconEye}</span> ikonuna tiklayarak responsive onizlemeyi goruntuleyin.</p>
      </footer>

      <!-- NOTIFICATION TOAST -->
      <div id="notif-toast" class="notif-toast">
        <div style="font-family:var(--font-sans);font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:0.375rem;">Bildirim</div>
        <div id="notif-toast-body" style="font-family:var(--font-sans);font-size:0.875rem;color:var(--text-primary);">Yeni bildirim</div>
      </div>

      <script>
        (function() {
          document.addEventListener("DOMContentLoaded", function() {
            document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
              anchor.addEventListener("click", function(e) {
                e.preventDefault();
                var target = document.querySelector(this.getAttribute("href"));
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });

            var notif = fiyuu.channel("onepage-notifs");
            var toast = document.getElementById("notif-toast");
            var toastBody = document.getElementById("notif-toast-body");
            notif.on("welcome", function(data) {
              if (toastBody) toastBody.textContent = data.message || "Yeni bir bildirim var!";
              if (toast) { toast.classList.add("show"); setTimeout(function() { toast.classList.remove("show"); }, 4000); }
            });

            var subBtn = document.getElementById("sub-btn");
            var subEmail = document.getElementById("sub-email");
            var subStatus = document.getElementById("sub-status");
            if (subBtn) {
              subBtn.addEventListener("click", async function() {
                var email = subEmail.value.trim();
                if (!email) { subStatus.style.display = "block"; subStatus.style.color = "var(--danger)"; subStatus.textContent = "Email gerekli."; return; }
                subBtn.disabled = true;
                try {
                  var res = await fiyuu.action("/", { action: "subscribe", email: email });
                  if (res && res.success) {
                    subStatus.style.display = "block"; subStatus.style.color = "var(--accent)"; subStatus.textContent = res.message; subEmail.value = "";
                  } else {
                    subStatus.style.display = "block"; subStatus.style.color = "var(--danger)"; subStatus.textContent = (res && res.message) || "Hata olustu.";
                  }
                } catch(e) {
                  subStatus.style.display = "block"; subStatus.style.color = "var(--danger)"; subStatus.textContent = "Hata olustu.";
                } finally { subBtn.disabled = false; }
              });
            }

            var contactBtn = document.getElementById("contact-btn");
            if (contactBtn) {
              contactBtn.addEventListener("click", async function() {
                var name = document.getElementById("contact-name").value.trim();
                var message = document.getElementById("contact-message").value.trim();
                var status = document.getElementById("contact-status");
                if (!message) { status.style.display = "block"; status.style.color = "var(--danger)"; status.textContent = "Mesaj gerekli."; return; }
                contactBtn.disabled = true;
                try {
                  var res = await fiyuu.action("/", { action: "contact", name: name, message: message });
                  if (res && res.success) {
                    status.style.display = "block"; status.style.color = "var(--accent)"; status.textContent = res.message;
                    document.getElementById("contact-name").value = "";
                    document.getElementById("contact-message").value = "";
                  }
                } catch(e) {
                  status.style.display = "block"; status.style.color = "var(--danger)"; status.textContent = "Hata olustu.";
                } finally { contactBtn.disabled = false; }
              });
            }
          });
        })();
      </script>
    `;
  }
}
