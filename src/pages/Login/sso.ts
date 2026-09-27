import type { LoginRequest } from "@/api/auth";

export function readSsoCallback(search: string): LoginRequest | null {
  const params = new URLSearchParams(search);
  const ticket = params.get("ticket");
  const code = params.get("code");
  if (ticket) return { ticket };
  if (code) return { code, state: params.get("state") ?? undefined };
  return null;
}

export function safeReturnTo(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function addReauthentication(url: string, authType: string, failed: boolean): string {
  if (!failed) return url;
  const parsed = new URL(url, window.location.origin);
  if (authType === "OIDC") parsed.searchParams.set("prompt", "login");
  if (authType === "CAS") parsed.searchParams.set("renew", "true");
  return parsed.toString();
}

