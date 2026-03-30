import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "Fiyuu OnePage",
    port: 4080,
  },
  data: {
    path: ".fiyuu/data",
    autosave: true,
    autosaveIntervalMs: 3000,
    tables: ["contacts", "newsletter", "analytics"],
  },
  realtime: {
    enabled: true,
    transports: ["websocket"],
  },
  services: {
    enabled: true,
    directory: "app/services",
  },
  websocket: {
    enabled: true,
    path: "/__fiyuu/ws",
  },
};

export default config;
