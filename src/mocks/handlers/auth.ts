import { http, HttpResponse, delay } from "msw";
import { faker } from "@faker-js/faker";
import { ok } from "@/mocks/lib/response";
import type { UserRoles } from "@/types/entities";

// Mock-only: the backend resolves the current user from the token; here we just
// remember the last username that logged in so /user/info can mirror it.
let lastLoggedInUsername = "admin";

// Aligned target shape for UserRoles (backend /user/info is currently a stub;
// this is what it's expected to return once implemented — see design doc).
const MOCK_USER_ROLES: Record<string, UserRoles> = {
  admin: { global: "SUPER_ADMIN", workspaces: {} },
  user: { workspaces: { 1: "VIEWER", 2: "DEVELOPER" } },
};

export const authHandlers = [
  // POST /api/login
  http.post("/api/login", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { username?: string; password?: string };

    if (body.username !== "admin" && body.username !== "user") {
      return HttpResponse.json({ message: "用户名或密码错误" }, { status: 401 });
    }
    if (body.password !== "123456") {
      return HttpResponse.json({ message: "用户名或密码错误" }, { status: 401 });
    }

    lastLoggedInUsername = body.username;
    return ok({ token: faker.string.uuid(), workspaceId: 1 });
  }),

  // POST /api/logout
  http.post("/api/logout", async () => {
    await delay(100);
    return ok({ redirectUrl: "" });
  }),

  // GET /api/login/config
  http.get("/api/login/config", async () => {
    await delay(50);
    return ok({ authType: "LOCAL", ssoLoginUrl: "" });
  }),

  // GET /api/user/info
  http.get("/api/user/info", async () => {
    await delay(150);
    const roles = MOCK_USER_ROLES[lastLoggedInUsername] ?? MOCK_USER_ROLES.admin;
    return ok({
      name: lastLoggedInUsername,
      roles,
      status: "NORMAL",
      avatar: "",
    });
  }),
];
