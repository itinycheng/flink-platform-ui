import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CatalogSelect from "./CatalogSelect";
import * as picker from "@/api/picker";
import { useWorkspaceStore } from "@/stores/workspaceStore";

vi.mock("@/api/picker");

beforeEach(() => {
  useWorkspaceStore.setState({ currentId: 1 });
  vi.mocked(picker.listCatalogs).mockResolvedValue([{ id: 5, name: "cat_hive", type: "HIVE", createSql: "" }]);
});

describe("CatalogSelect", () => {
  it("emits selected catalog ids (multiple)", async () => {
    const onChange = vi.fn();
    render(<CatalogSelect value={[]} onChange={onChange} />);
    await waitFor(() => expect(picker.listCatalogs).toHaveBeenCalledTimes(1));
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("cat_hive · HIVE"));
    expect(onChange).toHaveBeenCalledWith([5], expect.anything());
  });
});
