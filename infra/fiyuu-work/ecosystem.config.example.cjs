module.exports = {
  apps: [
    {
      name: "fiyuu-control-plane",
      cwd: "/opt/fiyuu/control-plane",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "7788",
        FIYUU_ADMIN_SECRET: "change-me",
        FIYUU_CORS_ORIGIN: "https://fiyuu.work",
      },
    },
    {
      name: "fiyuu-deploy-worker",
      cwd: "/opt/fiyuu/control-plane",
      script: "npm",
      args: "run start:worker",
      env: {
        NODE_ENV: "production",
        FIYUU_DEPLOY_HOOK: "/opt/fiyuu/hooks/deploy-tenant.sh",
        FIYUU_IMAGE_PREFIX: "ghcr.io/fiyuu/sites",
        FIYUU_DOMAIN_SUFFIX: "fiyuu.work",
      },
    },
  ],
};
