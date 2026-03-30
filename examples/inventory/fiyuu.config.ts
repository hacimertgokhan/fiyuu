import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "Fiyuu Inventory",
    port: 4070,
  },
  data: {
    path: ".fiyuu/data",
    autosave: true,
    autosaveIntervalMs: 3000,
    tables: ["products", "stock_movements", "categories", "alerts"],
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
