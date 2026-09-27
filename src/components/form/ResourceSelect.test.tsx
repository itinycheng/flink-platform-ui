import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResourceSelect from "./ResourceSelect";
import * as picker from "@/api/picker";
import { useWorkspaceStore } from "@/stores/workspaceStore";

vi.mock("@/api/picker");

beforeEach(() => {
  useWorkspaceStore.setState({ currentId: 1 });
  vi.mocked(picker.listResourceFiles).mockResolvedValue([{ id: 7, name: "udf.jar", type: "FILE" }]);
});

describe("ResourceSelect", () => {
  it("defaults to the jar ext and emits selected ids", async () => {
    const onChange = vi.fn();
    render(<ResourceSelect value={[]} onChange={onChange} />);
    await waitFor(() => expect(picker.listResourceFiles).toHaveBeenCalledWith("jar"));
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("udf.jar"));
    expect(onChange).toHaveBeenCalledWith([7], expect.anything());
  });
});
