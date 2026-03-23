import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { message } from "antd";

const request = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// Request interceptor: attach Authorization Bearer token from localStorage
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Avoid redirect loop if already on login page
        if (window.location.pathname !== "/login") {
          message.error("认证已过期，请重新登录");
          window.location.href = "/login";
        }
      } else if (status === 403) {
        message.error("没有权限访问该资源");
      } else if (status === 404) {
        message.error("请求的资源不存在");
      } else if (status === 500) {
        message.error("服务器内部错误");
      } else {
        message.error(`请求失败 (${status})`);
      }
    } else if (error.code === "ECONNABORTED") {
      message.error("请求超时，请稍后重试");
    } else {
      message.error("网络错误，请检查网络连接");
    }

    return Promise.reject(error);
  },
);

export default request;
