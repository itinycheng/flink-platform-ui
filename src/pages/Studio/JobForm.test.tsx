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
  listFlows: vi.fn().mockResolvedValue([{ id: 3, name: "flow-a" }]),
}));

vi.mock("@/components/CodeEditor", () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <textarea aria-label="code-editor" value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} />
  ),
}));

describe("JobForm", () => {
  beforeEach(() => {
    useJobStore.setState({
      loadJobInfo: vi.fn().mockResolvedValue({
        id: 10,
        flowId: 3,
        name: "job-a",
        type: "MYSQL_SQL",
        execMode: "BATCH",
        deployMode: "RUN_LOCAL",
        routeUrl: [1],
        subject: "SELECT 1",
        status: "ONLINE",
        config: { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 1 },
      } as never),
      saveJobInfo: vi.fn().mockImplementation(async (_nodeId: string, info: object) => info),
    } as never);
  });

  it("loads the JobInfo and shows its name", async () => {
    render(<JobForm nodeId="10" />);
    await waitFor(() => expect(useJobStore.getState().loadJobInfo).toHaveBeenCalledWith("10"));
    expect(await screen.findByDisplayValue("job-a")).toBeInTheDocument();
  });

  it("carries the loaded id/status through onSave, so an edit updates instead of creating", async () => {
    render(<JobForm nodeId="10" />);
    const nameInput = await screen.findByDisplayValue("job-a");
    fireEvent.change(nameInput, { target: { value: "job-a-edited" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobInfo).toHaveBeenCalled());

    const saveJobInfo = useJobStore.getState().saveJobInfo as ReturnType<typeof vi.fn>;
    const savedInfo = saveJobInfo.mock.calls[0][1] as { id: number; status: string; name: string };
    expect(savedInfo.id).toBe(10);
    expect(savedInfo.status).toBe("ONLINE");
    expect(savedInfo.name).toBe("job-a-edited");
  });

  it("validates required routeUrl before saving", async () => {
    (useJobStore.getState().loadJobInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 11,
      flowId: 3,
      name: "job-b",
      type: "SHELL",
      execMode: "BATCH",
      deployMode: "RUN_LOCAL",
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
      flowId: 3,
      name: "job-c",
      type: "MYSQL_SQL",
      execMode: "STREAMING",
      deployMode: "RUN_LOCAL",
      routeUrl: [1],
      subject: "SELECT 1",
      config: { type: "MYSQL_SQL", retryTimes: 0, retryInterval: "5s", dsId: 5 },
    });
    render(<JobForm nodeId="12" />);
    await screen.findByDisplayValue("job-c");

    // Switch `type` from MYSQL_SQL to CONDITION via the real Select control.
    // CONDITION has `needsSubject: false`, so — unlike SHELL — Save doesn't
    // require filling in the (Monaco-backed, hard-to-drive-in-jsdom) subject
    // field, letting this test prove the reset all the way through a real
    // save instead of just asserting on `validateFields()` rejecting it.
    fireEvent.mouseDown(document.getElementById("type")!);
    fireEvent.click(await screen.findByText("Condition"));
    // Wait for the ConfigFields swap (SqlConfigFields -> ConditionConfigFields)
    // to actually commit before saving, otherwise the stale, now-unmounted-
    // but-not-yet-rerendered `dsId` field (with its required rule) can still
    // be the one `validateFields()` sees, hiding the bug this test guards.
    // Both the selected option text and `taskForm.condition`'s field label
    // render as "Condition" once the switch lands, so a plain `findByText`
    // would be ambiguous — wait on the field's element id instead.
    await waitFor(() => expect(document.getElementById("config_condition")).toBeInTheDocument());

    // `config.condition` is itself required by `ConditionConfigFields`, so it
    // must be filled in for `validateFields()` to let Save through.
    fireEvent.mouseDown(document.getElementById("config_condition")!);
    fireEvent.click(await screen.findByText("All matched"));

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobInfo).toHaveBeenCalled());

    const saveJobInfo = useJobStore.getState().saveJobInfo as ReturnType<typeof vi.fn>;
    const savedInfo = saveJobInfo.mock.calls[0][1] as { config: Record<string, unknown>; execMode: string };
    expect(savedInfo.config).not.toHaveProperty("dsId");
    expect(savedInfo.config.type).toBe("CONDITION");
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

  it("uses a valid deployment default for local and Flink task types", () => {
    expect(typeChangeFields("SHELL").find((f) => f.name === "deployMode")?.value).toBe("RUN_LOCAL");
    expect(typeChangeFields("FLINK_SQL").find((f) => f.name === "deployMode")?.value).toBe("FLINK_YARN_PER");
    expect(typeChangeFields("FLINK_JAR", "BATCH", "FLINK_YARN_SESSION").find((f) => f.name === "deployMode")?.value).toBe(
      "FLINK_YARN_SESSION",
    );
  });

  it("always clears subject on a type change, even between two subject-bearing types", () => {
    expect(typeChangeFields("CONDITION").find((f) => f.name === "subject")?.value).toBeUndefined();
    expect(typeChangeFields("SHELL").find((f) => f.name === "subject")?.value).toBeUndefined();
    expect(typeChangeFields("MYSQL_SQL").find((f) => f.name === "subject")?.value).toBeUndefined();
  });
});
