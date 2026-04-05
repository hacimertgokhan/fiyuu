const config = {
  app: {
    name: "hacimertgokhan.me",
    runtime: "node",
    port: 4060,
  },
  ai: {
    enabled: false,
    graphContext: true,
  },
  fullstack: {
    client: true,
    serverActions: false,
    serverQueries: true,
    sockets: false,
  },
  data: {
    driver: "none",
  },
  security: {
    requestEncryption: false,
    serverSecretFile: "./.fiyuu/SECRET",
  },
  middleware: {
    enabled: false,
  },
  developerTools: {
    enabled: true,
    renderTiming: true,
  },
  observability: {
    requestId: true,
    warningsAsOverlay: true,
  },
  auth: {
    enabled: false,
    sessionStrategy: "cookie",
  },
  analytics: {
    enabled: true,
    provider: "console",
  },
  featureFlags: {
    enabled: true,
    defaults: {
      localeToggle: true,
      mobileQuickNav: true,
      projectFilters: true,
    },
  },
  seo: {
    baseUrl: "https://hacimertgokhan.me",
    sitemap: true,
    robots: true,
  },
};

export default config;
