/**
 * Central runtime configuration.
 *
 * Per-environment values come from Vite env files (.env, .env.[mode], .env.local)
 * and are read through `import.meta.env` here — so there is one place to see
 * everything the app can be configured with, and consumers import typed values
 * instead of reaching into `import.meta.env` (or hardcoding literals) directly.
 */

/** Application metadata, injected at build time from package.json. */
export const APP = {
  name: __APP_NAME__,
  version: __APP_VERSION__,
} as const;

/** HTTP client configuration (see src/utils/request.ts). */
export const API = {
  /** Base URL prepended to every request. */
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  /** Request timeout in milliseconds. */
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30_000,
} as const;

/**
 * Whether to start MSW request mocking. Driven by VITE_ENABLE_MOCK, but forced
 * off when a real backend proxy is configured (VITE_API_PROXY) — pointing dev at
 * a live backend implies you want live requests, not mocks.
 */
export const ENABLE_MOCK =
  import.meta.env.VITE_ENABLE_MOCK === "true" && !import.meta.env.VITE_API_PROXY;
