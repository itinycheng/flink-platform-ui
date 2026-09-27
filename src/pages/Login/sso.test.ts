import { describe, expect, it } from "vitest";
import { addReauthentication, readSsoCallback, safeReturnTo } from "./sso";

describe("SSO helpers", () => {
  it("reads OIDC and CAS callback parameters", () => {
    expect(readSsoCallback("?code=abc&state=state-1")).toEqual({ code: "abc", state: "state-1" });
    expect(readSsoCallback("?ticket=ST-123")).toEqual({ ticket: "ST-123" });
    expect(readSsoCallback("?other=value")).toBeNull();
  });

  it("allows only internal return paths", () => {
    expect(safeReturnTo("/runs?page=2")).toBe("/runs?page=2");
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example")).toBe("/dashboard");
  });

  it("adds provider-specific reauthentication parameters", () => {
    expect(addReauthentication("https://idp.example/auth", "OIDC", true)).toContain("prompt=login");
    expect(addReauthentication("https://cas.example/login", "CAS", true)).toContain("renew=true");
  });
});
