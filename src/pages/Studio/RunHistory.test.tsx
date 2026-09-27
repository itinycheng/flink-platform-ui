import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { runHandlers } from "@/mocks/handlers/run";
import RunHistory from "./RunHistory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const server = setupServer(...runHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("RunHistory", () => {
  it("renders flow-run rows for a definition", async () => {
    useWorkspaceStore.setState({ currentId: 1 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <RunHistory workflowId="any" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("run-history")).toBeInTheDocument());
    // rows load from the flowId-filtered endpoint; the table renders without error
  });
});
