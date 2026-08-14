import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JobForm from "./JobForm";
import { useJobStore } from "@/stores/jobStore";

vi.mock("@/api/picker", () => ({
  listWorkers: vi.fn().mockResolvedValue([{ id: 1, name: "w", ip: "10.0.0.1", port: "80", status: "ACTIVE" }]),
  listDatasources: vi.fn().mockResolvedValue([{ id: 1, name: "ds", type: "MYSQL", params: { url: "" } }]),
  listCatalogs: vi.fn().mockResolvedValue([]),
  listResourceFiles: vi.fn().mockResolvedValue([]),
}));

describe("JobForm", () => {
  beforeEach(() => {
    useJobStore.setState({
      loadJobInfo: vi.fn().mockResolvedValue({
        id: 10,
        name: "job-a",
        type: "MYSQL_SQL",
        execMode: "BATCH",
        routeUrl: [1],
        subject: "SELECT 1",
        config: { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 1 },
      } as never),
      saveJobInfo: vi.fn().mockResolvedValue(undefined as never),
    } as never);
  });

  it("loads the JobInfo and shows its name", async () => {
    render(<JobForm nodeId="10" />);
    await waitFor(() => expect(useJobStore.getState().loadJobInfo).toHaveBeenCalledWith("10"));
    expect(await screen.findByDisplayValue("job-a")).toBeInTheDocument();
  });

  it("validates required routeUrl before saving", async () => {
    (useJobStore.getState().loadJobInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 11,
      name: "job-b",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [],
      subject: "echo hi",
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    });
    render(<JobForm nodeId="11" />);
    await screen.findByDisplayValue("job-b");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobInfo).not.toHaveBeenCalled());
  });
});
