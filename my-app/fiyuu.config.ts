export default {
  app: {
    name: "Fiyuu App",
    runtime: "node",
    port: 4050,
  },
  ai: {
    enabled: true,
    skillsDirectory: "./skills",
    defaultSkills: ["product-strategist","seo-optimizer"],
    graphContext: true,
  },
  fullstack: {
    client: true,
    serverActions: true,
    serverQueries: true,
    sockets: true,
  },
  data: {
    driver: "f1",
    path: "./server/f1/schema.f1",
  },
  security: {
    requestEncryption: true,
    serverSecretFile: "./.fiyuu/SECRET",
  },
  middleware: {
    enabled: true,
  },
  websocket: {
    enabled: true,
    path: "/__fiyuu/ws",
    heartbeatMs: 15000,
    maxPayloadBytes: 65536,
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
    enabled: true,
    sessionStrategy: "cookie",
  },
  analytics: {
    enabled: true,
    provider: "console",
  },
  featureFlags: {
    enabled: true,
    defaults: {
      onboardingRevamp: true,
      realtimeCounter: true,
      requestInspector: true,
    },
  },
} as const;
