import "@testing-library/jest-dom/vitest";

// Global defines for tests (matching vite.config.ts)
// @ts-expect-error vite-defined global
globalThis.__APP_NAME__ = "dtail";
// @ts-expect-error vite-defined global
globalThis.__APP_VERSION__ = "0.0.1";

// Polyfill ResizeObserver for Ant Design components in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill matchMedia for Ant Design responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
