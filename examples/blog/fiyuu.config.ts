import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "Fiyuu Blog",
    port: 4060,
  },
  data: {
    path: ".fiyuu/data",
    autosave: true,
    autosaveIntervalMs: 3000,
    tables: ["posts", "comments", "notifications", "users"],
  },
  realtime: {
    enabled: true,
    transports: ["websocket"],
    websocket: {
      path: "/__fiyuu/ws",
      heartbeatMs: 30000,
    },
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
