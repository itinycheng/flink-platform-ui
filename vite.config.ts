import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  const apiBase = env.VITE_API_BASE_URL || "/api";
  const proxyTarget = env.VITE_API_PROXY;

  return {
    define: {
      __APP_NAME__: JSON.stringify(pkg.appTitle ?? pkg.name),
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    // When VITE_API_PROXY is set, forward API calls to a real backend in dev
    // instead of using the MSW mocks (which turn off automatically — see src/config).
    server: proxyTarget
      ? {
          proxy: {
            [apiBase]: { target: proxyTarget, changeOrigin: true },
          },
        }
      : undefined,
  };
});
