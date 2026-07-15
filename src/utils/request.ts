import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { message } from "antd";
import i18n from "@/i18n";
import { API } from "@/config";
import { STORAGE_KEYS } from "@/constants/storage";

const request = axios.create({
  baseURL: API.baseURL,
  timeout: API.timeout,
});

// Request interceptor: attach Authorization Bearer token from localStorage
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor: handle 401 and unified error messages
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        // Avoid redirect loop if already on login page
        if (window.location.pathname !== "/login") {
          message.error(i18n.t("http.authExpired"));
          window.location.href = "/login";
        }
      } else if (status === 403) {
        message.error(i18n.t("http.forbidden"));
      } else if (status === 404) {
        message.error(i18n.t("http.notFound"));
      } else if (status === 500) {
        message.error(i18n.t("http.serverError"));
      } else {
        message.error(i18n.t("http.requestFailed", { status }));
      }
    } else if (error.code === "ECONNABORTED") {
      message.error(i18n.t("http.timeout"));
    } else {
      message.error(i18n.t("http.networkError"));
    }

    return Promise.reject(error);
  },
);

/**
 * Thin wrapper around axios that returns `response.data` directly.
 * Use this in api/*.ts to avoid repeating `.then((r) => r.data)`.
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request.put<T>(url, data, config).then((r) => r.data),
  delete: <T = void>(url: string, config?: AxiosRequestConfig) => request.delete<T>(url, config).then((r) => r.data),
};
