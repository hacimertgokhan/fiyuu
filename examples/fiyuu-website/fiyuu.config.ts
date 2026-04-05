import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "fiyuu",
    port: 4070,
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
  seo: {
    baseUrl: "https://fiyuu.work",
    sitemap: true,
    robots: true,
  },
};

export default config;
