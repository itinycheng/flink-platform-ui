import request from "./request";
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
  return request.post<LoginResponse>("/auth/login", data).then((res) => res.data);
}

export function logout(): Promise<void> {
  return request.post("/auth/logout").then(() => undefined);
}
