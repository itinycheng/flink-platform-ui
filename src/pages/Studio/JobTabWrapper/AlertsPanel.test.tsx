import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AlertsPanel from "./AlertsPanel";
import { useJobStore } from "@/stores/jobStore";

vi.mock("@/api/alert", () => ({
  getAllAlertRules: vi.fn().mockResolvedValue([{ id: 1, name: "a", type: "EMAIL", createdAt: "", updatedAt: "" }]),
}));

describe("AlertsPanel", () => {
  beforeEach(() => {
    useJobStore.setState({
      loadJobFlow: vi.fn().mockResolvedValue({
        id: 5,
        name: "f",
        type: "JOB_FLOW",
        alerts: [{ alertId: 1, statuses: ["SUCCESS"] }],
      }),
      saveJobFlow: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it("loads the flow's alerts and persists edits via saveJobFlow", async () => {
    render(<AlertsPanel nodeId="5" />);
    await waitFor(() => expect(useJobStore.getState().loadJobFlow).toHaveBeenCalledWith("5"));
    expect(await screen.findByText("a(EMAIL)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobFlow).toHaveBeenCalled());

    const arg = (useJobStore.getState().saveJobFlow as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(arg.alerts).toEqual([{ alertId: 1, statuses: ["SUCCESS"] }]);
    // Unedited fields (type, name) must survive the save — merged over the loaded flow.
    expect(arg.type).toBe("JOB_FLOW");
    expect(arg.name).toBe("f");
  });
});
