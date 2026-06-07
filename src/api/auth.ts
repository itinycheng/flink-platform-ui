import { http } from "@/utils/request";
import type { User } from "@/types/auth";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>("/auth/login", data);
}

export function logout(): Promise<void> {
  return http.post<void>("/auth/logout");
}
