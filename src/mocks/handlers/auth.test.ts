import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { authHandlers } from "@/mocks/handlers/auth";
import { login, logout, getLoginConfig, getUserInfo } from "@/api/auth";

const server = setupServer(...authHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("auth handlers", () => {
  it("login unwraps to {token, workspaceId}", async () => {
    const res = await login({ username: "admin", password: "123456" });
    expect(typeof res.token).toBe("string");
    expect(res.workspaceId).toBe(1);
  });

  it("login with bad credentials rejects (401)", async () => {
    await expect(login({ username: "admin", password: "wrong" })).rejects.toBeTruthy();
    await expect(login({ username: "nobody", password: "123456" })).rejects.toBeTruthy();
  });

  it("accepts OIDC and CAS callback credentials", async () => {
    await expect(login({ code: "code-1", state: "state-1" })).resolves.toEqual(
      expect.objectContaining({ token: expect.any(String), workspaceId: 1 }),
    );
    await expect(login({ ticket: "ST-1" })).resolves.toEqual(
      expect.objectContaining({ token: expect.any(String), workspaceId: 1 }),
    );
  });

  it("normalizes the backend's lowercase local auth type", async () => {
    const config = await getLoginConfig();
    expect(config.authType).toBe("LOCAL");
  });

  it("user/info returns SUPER_ADMIN for admin", async () => {
    await login({ username: "admin", password: "123456" });
    const user = await getUserInfo();
    expect(user.username).toBe("admin");
    expect(user.roles.global).toBe("SUPER_ADMIN");
  });

  it("user/info returns a per-workspace role map for user", async () => {
    await login({ username: "user", password: "123456" });
    const user = await getUserInfo();
    expect(user.username).toBe("user");
    expect(user.roles.global).toBeUndefined();
    expect(user.roles.workspaces).toEqual({ 1: "VIEWER", 2: "DEVELOPER" });
  });

  it("logout returns a redirectUrl", async () => {
    const res = await logout("some-token");
    expect(res).toHaveProperty("redirectUrl");
  });
});
