import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "hacimertgokhan.me",
    port: 4060,
  },
  data: {
    driver: "f1",
    path: ".fiyuu/data/f1.json",
  },
  middleware: {
    enabled: false,
  },
  developerTools: {
    enabled: true,
  },
  auth: {
    enabled: false,
  },
};

export default config;
