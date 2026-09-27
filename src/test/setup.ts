import "@testing-library/jest-dom/vitest";
import "@/i18n";
import { afterEach } from "vitest";
import { queryClient } from "@/app/queryClient";

afterEach(() => queryClient.clear());

// Monaco checks this legacy clipboard capability during module initialisation.
Object.defineProperty(document, "queryCommandSupported", {
  configurable: true,
  value: () => false,
});

// jsdom logs a not-implemented error when component libraries pass a pseudo
// element. Tests only need the element's computed styles.
const getComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element: Element) => getComputedStyle(element);

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
