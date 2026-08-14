import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import pkg from "./package.json";

export default defineConfig({
  define: {
    __APP_NAME__: JSON.stringify(pkg.appTitle ?? pkg.name),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@ant-design/pro-components": path.resolve(
        import.meta.dirname,
        "./node_modules/@ant-design/pro-components/es/index.js",
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    server: {
      deps: {
        inline: ["@ant-design/pro-components"],
      },
    },
  },
});
