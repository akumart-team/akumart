// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";

export default (configEnv: ConfigEnv) => {
  const env = loadEnv(configEnv.mode, process.cwd(), "API_PROXY_");
  const proxyTarget = env.API_PROXY_TARGET?.trim();
  if (configEnv.command === "serve" && !proxyTarget) {
    throw new Error("Set API_PROXY_TARGET in .env.local (see .env.example) before starting Vite.");
  }

  return defineConfig({
    vite: {
      server: {
        proxy: proxyTarget ? { "/api": { target: proxyTarget, changeOrigin: true } } : undefined,
      },
    },
    tanstackStart: {
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    },
  })(configEnv);
};
