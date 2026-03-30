import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "Fiyuu Blog",
    port: 4050,
  },
  data: {
    driver: "f1",
    path: ".fiyuu/data/f1.json",
  },
  middleware: {
    enabled: true,
  },
  developerTools: {
    enabled: true,
  },
  auth: {
    enabled: true,
  },
};

export default config;
