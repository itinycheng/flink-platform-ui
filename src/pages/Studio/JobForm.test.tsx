import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JobForm from "./JobForm";
import { typeChangeFields } from "./JobForm.typeChange";
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

  it("resets config and execMode when the user switches type, dropping stale cross-type fields", async () => {
    (useJobStore.getState().loadJobInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12,
      name: "job-c",
      type: "MYSQL_SQL",
      execMode: "STREAMING",
      routeUrl: [1],
      subject: "SELECT 1",
      config: { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 5 },
    });
    render(<JobForm nodeId="12" />);
    await screen.findByDisplayValue("job-c");

    // Switch `type` from MYSQL_SQL to SHELL via the real Select control.
    fireEvent.mouseDown(document.getElementById("type")!);
    fireEvent.click(await screen.findByText("Shell"));
    // Wait for the ConfigFields swap (SqlConfigFields -> ShellConfigFields) to
    // actually commit before saving, otherwise the stale, now-unmounted-but-
    // not-yet-rerendered `dsId` field (with its required rule) can still be
    // the one `validateFields()` sees, hiding the bug this test guards.
    await screen.findByText("Timeout");

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobInfo).toHaveBeenCalled());

    const saveJobInfo = useJobStore.getState().saveJobInfo as ReturnType<typeof vi.fn>;
    const savedInfo = saveJobInfo.mock.calls[0][1] as { config: Record<string, unknown>; execMode: string };
    expect(savedInfo.config).not.toHaveProperty("dsId");
    expect(savedInfo.config.type).toBe("SHELL");
    expect(savedInfo.execMode).toBe("BATCH");
  });
});

describe("typeChangeFields", () => {
  it("drops the old type's config entirely and resets retry defaults", () => {
    const fields = typeChangeFields("SHELL");
    const config = fields.find((f) => f.name === "config")?.value as Record<string, unknown>;
    expect(config).toEqual({ type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" });
    expect(config).not.toHaveProperty("dsId");
  });

  it("clears execMode to BATCH for non-Flink types, preserves it for Flink types", () => {
    expect(typeChangeFields("SHELL", "STREAMING").find((f) => f.name === "execMode")?.value).toBe("BATCH");
    expect(typeChangeFields("FLINK_SQL", "STREAMING").find((f) => f.name === "execMode")?.value).toBe("STREAMING");
  });

  it("clears subject for types that don't need one, leaves it alone otherwise", () => {
    expect(typeChangeFields("CONDITION").some((f) => f.name === "subject" && f.value === undefined)).toBe(true);
    expect(typeChangeFields("SHELL").some((f) => f.name === "subject")).toBe(false);
  });
});
