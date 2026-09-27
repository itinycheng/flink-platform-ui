import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DatasourceSelect from "./DatasourceSelect";
import * as picker from "@/api/picker";
import { useWorkspaceStore } from "@/stores/workspaceStore";

vi.mock("@/api/picker");

beforeEach(() => {
  useWorkspaceStore.setState({ currentId: 1 });
  vi.mocked(picker.listDatasources).mockResolvedValue([{ id: 1, name: "mysql-a", type: "MYSQL", params: { url: "" } }]);
});

describe("DatasourceSelect", () => {
  it("passes jobType to the fetcher and refetches when it changes", async () => {
    const { rerender } = render(<DatasourceSelect value={undefined} onChange={() => {}} jobType="MYSQL_SQL" />);
    await waitFor(() => expect(picker.listDatasources).toHaveBeenCalledWith("MYSQL_SQL"));
    rerender(<DatasourceSelect value={undefined} onChange={() => {}} jobType="HIVE_SQL" />);
    await waitFor(() => expect(picker.listDatasources).toHaveBeenCalledWith("HIVE_SQL"));
  });

  it("emits the selected datasource id (single value)", async () => {
    const onChange = vi.fn();
    render(<DatasourceSelect value={undefined} onChange={onChange} jobType="MYSQL_SQL" />);
    await waitFor(() => expect(picker.listDatasources).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("mysql-a · MYSQL"));
    expect(onChange).toHaveBeenCalledWith(1, expect.anything());
  });
});
