import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { message } from "antd";
import i18n from "@/i18n";
import { API } from "@/config";
import { STORAGE_KEYS } from "@/constants/storage";

export const AUTH_EXPIRED_EVENT = "flink-platform:auth-expired";
const LEGACY_AUTH_ERROR_CODES = new Set([50008, 50012, 50014]);

function expireSession(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.workspaceId);
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip the global error toast for this request (caller handles it). */
    suppressErrorToast?: boolean;
  }
}

const request = axios.create({
  baseURL: API.baseURL,
  timeout: API.timeout,
});

// Request interceptor: attach the headers understood by the deployed backend.
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      config.headers["X-Token"] = token;
    }
    // Multi-tenant isolation: scope every request to the active workspace.
    const workspaceId = localStorage.getItem(STORAGE_KEYS.workspaceId);
    if (workspaceId) {
      config.headers["X-Workspace-Id"] = workspaceId;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/** i18n key for each non-401 HTTP status with a dedicated message; falls back to "http.requestFailed". */
const HTTP_STATUS_MESSAGE_KEYS: Record<number, string> = {
  403: "http.forbidden",
  404: "http.notFound",
  500: "http.serverError",
};

// Response interceptor: unwrap the envelope + unified error messages
request.interceptors.response.use(
  (response) => {
    try {
      response.data = unwrapEnvelope(response.data);
      return response;
    } catch (err) {
      // Business error (code!==0). Toast here (a rejection from the success
      // handler bypasses this same interceptor's error handler), then propagate.
      const apiError = err as Error & { code?: number };
      if (apiError.code && LEGACY_AUTH_ERROR_CODES.has(apiError.code)) expireSession();
      if (!response.config?.suppressErrorToast) message.error(apiError.message);
      return Promise.reject(err);
    }
  },
  (error: AxiosError) => {
    const suppressErrorToast = error.config?.suppressErrorToast;

    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        expireSession();
        if (window.location.pathname !== "/login") {
          if (!suppressErrorToast) message.error(i18n.t("http.authExpired"));
        }
      } else if (!suppressErrorToast) {
        message.error(i18n.t(HTTP_STATUS_MESSAGE_KEYS[status] ?? "http.requestFailed", { status }));
      }
    } else if (!suppressErrorToast) {
      message.error(i18n.t(error.code === "ECONNABORTED" ? "http.timeout" : "http.networkError"));
    }

    return Promise.reject(error);
  },
);

/**
 * Unwrap the backend response envelope `{ code, desc, data }`.
 *
 * Transitional shim: real-backend responses always carry the envelope, but
 * not-yet-migrated MSW mocks return plain bodies. A body is treated as an
 * envelope only when it has a numeric `code` and a `data` property; anything
 * else is returned untouched so legacy mocks keep working.
 */
export function unwrapEnvelope<T>(body: unknown): T {
  if (body !== null && typeof body === "object" && "code" in body && "data" in body) {
    const env = body as { code: number; desc?: string; data: T };
    if (typeof env.code === "number") {
      if (env.code !== 0) {
        throw Object.assign(new Error(env.desc || i18n.t("http.requestFailed", { status: env.code })), {
          code: env.code,
          isBusiness: true,
        });
      }
      return env.data;
    }
  }
  return body as T;
}

/**
 * Thin wrapper around axios that returns unwrapped response data.
 * The response interceptor already unwraps backend envelopes `{ code, desc, data }`
 * (and toasts business errors), while maintaining backward compatibility with
 * plain-body legacy MSW mocks. Use this in api/*.ts to avoid repeating `.then((r) => r.data)`.
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request.get<T>(url, config).then((r) => r.data as T),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request.post<T>(url, data, config).then((r) => r.data as T),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request.put<T>(url, data, config).then((r) => r.data as T),
  delete: <T = void>(url: string, config?: AxiosRequestConfig) =>
    request.delete<T>(url, config).then((r) => r.data as T),
};
