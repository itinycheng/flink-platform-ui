import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import UserList from "./UserList";
import * as adminApi from "@/api/admin";
import * as wsApi from "@/api/workspace";

// UserList is normally rendered inside App.tsx's <ConfigProvider locale={...}>. Without an
// ancestor ConfigProvider, antd's Modal falls back to its built-in default locale (zh_CN), so
// the OK/Cancel buttons render Chinese text instead of the `en` labels used elsewhere in the
// app. Wrap with the English locale here to match production and keep selectors in English.
function renderUserList() {
  return render(
    <ConfigProvider locale={enUS}>
      <UserList />
    </ConfigProvider>,
  );
}

vi.mock("@/api/admin");
vi.mock("@/api/workspace");

const USER = {
  id: "u1",
  username: "alice",
  email: "a@x.com",
  roles: { global: "ADMIN", workspaces: { 1: "OPERATOR" } },
  status: "NORMAL",
  createdAt: "",
};

beforeEach(() => {
  vi.mocked(adminApi.getUsers).mockResolvedValue({ data: [USER], total: 1 } as never);
  vi.mocked(adminApi.updateUser).mockResolvedValue(1 as never);
  vi.mocked(wsApi.getAllWorkspaces).mockResolvedValue([
    { id: 1, name: "Default Workspace", status: "ENABLE", isDefault: true, createdAt: "" },
    { id: 2, name: "WS Two", status: "ENABLE", createdAt: "" },
  ] as never);
});

describe("UserList", () => {
  it("preserves + edits workspaces roles on save (does not wipe them)", async () => {
    renderUserList();
    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Edit"));

    await waitFor(() => expect(screen.getByTestId("user-form")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(adminApi.updateUser).toHaveBeenCalled());
    const payload = vi.mocked(adminApi.updateUser).mock.calls[0][1] as {
      roles: { global: string; workspaces: Record<string, string> };
    };
    expect(payload.roles.global).toBe("ADMIN");
    expect(payload.roles.workspaces).toEqual({ 1: "OPERATOR" });
  });
});
