import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import { useAuthStore, useAuthPermissions } from "@/stores/authStore";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
  useAuthPermissions: vi.fn(),
}));

function renderGuard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/403" element={<div>Forbidden Page</div>} />
        <Route
          path="*"
          element={
            <AuthGuard>
              <div>Protected</div>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthGuard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /login when there is no token", () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: null, user: null } as never));
    vi.mocked(useAuthPermissions).mockReturnValue([]);

    renderGuard("/dashboard");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to /403 when the loaded user lacks the route's permission", () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ token: "t", user: { username: "u", roles: {} } } as never),
    );
    vi.mocked(useAuthPermissions).mockReturnValue([]);

    renderGuard("/admin/users");

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });

  it("renders children when effective permissions include the route's permission", () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ token: "t", user: { username: "u", roles: { global: "SUPER_ADMIN" } } } as never),
    );
    vi.mocked(useAuthPermissions).mockReturnValue(["WORKSPACE_VIEW"]);

    renderGuard("/dashboard");

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("allows access while user info hasn't loaded yet, even on a gated route", () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: "t", user: null } as never));
    vi.mocked(useAuthPermissions).mockReturnValue([]);

    renderGuard("/admin/users");

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});
