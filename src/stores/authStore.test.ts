import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import { useWorkspaceStore } from "./workspaceStore";
import * as authApi from "@/api/auth";
import { STORAGE_KEYS } from "@/constants/storage";

vi.mock("@/api/auth");

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
    useWorkspaceStore.setState({ currentId: null, workspaces: [] });
  });

  it("login stores the token, sets the resolved workspace, and loads the user", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: "tok-1", workspaceId: 2 });
    vi.mocked(authApi.getUserInfo).mockResolvedValue({
      username: "admin",
      roles: { global: "SUPER_ADMIN", workspaces: {} },
      status: "NORMAL",
    });

    await useAuthStore.getState().login("admin", "123456");

    expect(authApi.login).toHaveBeenCalledWith({ username: "admin", password: "123456" });
    expect(useAuthStore.getState().token).toBe("tok-1");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.username).toBe("admin");
    expect(useWorkspaceStore.getState().currentId).toBe(2);
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe("tok-1");
    expect(localStorage.getItem(STORAGE_KEYS.workspaceId)).toBe("2");
  });

  it("login does not touch the workspace when the server returns no workspaceId", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: "tok-1", workspaceId: null });
    vi.mocked(authApi.getUserInfo).mockResolvedValue({
      username: "admin",
      roles: { global: "SUPER_ADMIN", workspaces: {} },
    });

    await useAuthStore.getState().login("admin", "123456");

    expect(useWorkspaceStore.getState().currentId).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.workspaceId)).toBeNull();
  });

  it("loadUserInfo fetches and persists the current user", async () => {
    vi.mocked(authApi.getUserInfo).mockResolvedValue({
      username: "user",
      roles: { workspaces: { 1: "VIEWER" } },
      status: "NORMAL",
    });

    await useAuthStore.getState().loadUserInfo();

    expect(useAuthStore.getState().user?.username).toBe("user");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.user) ?? "null")).toEqual({
      username: "user",
      roles: { workspaces: { 1: "VIEWER" } },
      status: "NORMAL",
    });
  });

  it("logout calls the API with the current token, then clears the session and workspace", async () => {
    useAuthStore.setState({
      token: "tok-1",
      user: { username: "admin", roles: { global: "SUPER_ADMIN" } },
      isAuthenticated: true,
    });
    localStorage.setItem(STORAGE_KEYS.token, "tok-1");
    localStorage.setItem(STORAGE_KEYS.user, "{}");
    localStorage.setItem(STORAGE_KEYS.workspaceId, "2");
    useWorkspaceStore.setState({
      currentId: 2,
      workspaces: [{ id: 2, name: "ws-2", status: "ENABLE", createdAt: "2026-01-01" }],
    });
    vi.mocked(authApi.logout).mockResolvedValue({ redirectUrl: "" });

    await useAuthStore.getState().logout();

    expect(authApi.logout).toHaveBeenCalledWith("tok-1");
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.user)).toBeNull();
    // Fix 1: logout must also clear the workspace, otherwise the next user on
    // a shared browser inherits the previous user's stale workspaceId.
    expect(localStorage.getItem(STORAGE_KEYS.workspaceId)).toBeNull();
    expect(useWorkspaceStore.getState().currentId).toBeNull();
    expect(useWorkspaceStore.getState().workspaces).toEqual([]);
  });

  it("logout still clears the local session and workspace even if the API call rejects", async () => {
    useAuthStore.setState({ token: "tok-1", user: null, isAuthenticated: true });
    localStorage.setItem(STORAGE_KEYS.workspaceId, "2");
    useWorkspaceStore.setState({
      currentId: 2,
      workspaces: [{ id: 2, name: "ws-2", status: "ENABLE", createdAt: "2026-01-01" }],
    });
    vi.mocked(authApi.logout).mockRejectedValue(new Error("network"));

    await expect(useAuthStore.getState().logout()).rejects.toThrow("network");

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.workspaceId)).toBeNull();
    expect(useWorkspaceStore.getState().currentId).toBeNull();
  });
});
