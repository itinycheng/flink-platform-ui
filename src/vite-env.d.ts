/// <reference types="vite/client" />

declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Base URL prepended to every API request. */
  readonly VITE_API_BASE_URL: string;
  /** HTTP request timeout in milliseconds (parsed as a number). */
  readonly VITE_API_TIMEOUT: string;
  /** "true" to start MSW request mocking (development only). */
  readonly VITE_ENABLE_MOCK: string;
  /** Dev-only: backend origin to proxy API calls to (empty = use mocks). */
  readonly VITE_API_PROXY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
