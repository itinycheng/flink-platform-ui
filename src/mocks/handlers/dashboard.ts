import { http, delay } from "msw";
import { faker } from "@faker-js/faker";
import { ok } from "@/mocks/lib/response";

export const dashboardHandlers = [
  // Matches the deployed backend's aggregate count endpoint.
  http.get("/api/dashboard/jobFlowRunStatusCount", async () => {
    await delay(200);

    const success = faker.number.int({ min: 80, max: 200 });
    const failed = faker.number.int({ min: 2, max: 15 });
    const running = faker.number.int({ min: 1, max: 8 });

    return ok([
      { status: "SUCCESS", count: success },
      { status: "FAILURE", count: failed },
      { status: "RUNNING", count: running },
    ]);
  }),
];
