import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SchedulePanel from "./SchedulePanel";
import { useJobStore } from "@/stores/jobStore";

describe("SchedulePanel", () => {
  beforeEach(() => {
    useJobStore.setState({
      loadJobFlow: vi.fn().mockResolvedValue({
        id: 5,
        name: "f",
        type: "JOB_FLOW",
        cronExpr: "0 0 * * *",
        priority: 3,
        config: { parallelism: 3 },
        timeout: { enable: false },
      }),
      saveJobFlow: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it("loads the flow's cron and persists edits via saveJobFlow", async () => {
    render(<SchedulePanel nodeId="5" />);
    await waitFor(() => expect(useJobStore.getState().loadJobFlow).toHaveBeenCalledWith("5"));
    expect(await screen.findByDisplayValue("0 0 * * *")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(useJobStore.getState().saveJobFlow).toHaveBeenCalled());

    const arg = (useJobStore.getState().saveJobFlow as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(arg.config.parallelism).toBe(3);
    expect(arg.cronExpr).toBe("0 0 * * *");
    // Unedited fields (type, name) must survive the save — merged over the loaded flow.
    expect(arg.type).toBe("JOB_FLOW");
    expect(arg.name).toBe("f");
  });
});
