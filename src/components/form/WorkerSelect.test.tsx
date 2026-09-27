import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkerSelect from "./WorkerSelect";
import * as picker from "@/api/picker";
import { useWorkspaceStore } from "@/stores/workspaceStore";

vi.mock("@/api/picker");

beforeEach(() => {
  useWorkspaceStore.setState({ currentId: 1 });
  vi.mocked(picker.listWorkers).mockResolvedValue([
    { id: 1, name: "alpha", ip: "10.0.0.1", port: "80", role: "ACTIVE" },
    { id: 2, name: "beta", ip: "10.0.0.2", port: "80", role: "ACTIVE" },
  ]);
});

describe("WorkerSelect", () => {
  it("fetches workers on mount and shows them as options when opened", async () => {
    render(<WorkerSelect value={[]} onChange={() => {}} />);
    await waitFor(() => expect(picker.listWorkers).toHaveBeenCalledTimes(1));
    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(await screen.findByText("alpha (10.0.0.1) · ACTIVE")).toBeInTheDocument();
  });

  it("emits selected worker ids", async () => {
    const onChange = vi.fn();
    render(<WorkerSelect value={[]} onChange={onChange} />);
    await waitFor(() => expect(picker.listWorkers).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("beta (10.0.0.2) · ACTIVE"));
    expect(onChange).toHaveBeenCalledWith([2], expect.anything());
  });
});
