/**
 * localStorage keys used across the app. Centralized so the request interceptor
 * and the stores that own each value can't drift apart (they used to hardcode
 * the same string literals in separate files).
 */
export const STORAGE_KEYS = {
  /** Auth bearer token. */
  token: "token",
  /** Serialized current user. */
  user: "user",
  /** Active workspace id — sent as X-Workspace-Id on every request. */
  workspaceId: "workspaceId",
  /** Active UI language (en | zh). */
  lang: "lang",
  /** Recent query-console statements. */
  queryHistory: "dtail.query.history",
  /** Schema version of the persisted auth (token+user). Bump to invalidate stale sessions. */
  authVersion: "dtail.auth.version",
} as const;
