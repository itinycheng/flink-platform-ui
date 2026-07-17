import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { workflowHandlers } from "./job";
import { adminHandlers } from "./admin";
import { resourceHandlers } from "./resource";
import { auditHandlers } from "./audit";
import { monitorHandlers } from "./monitor";
import { runHandlers } from "./run";
import { alertRuleHandlers } from "./alert";
import { queryHandlers } from "./query";
import { workspaceHandlers } from "./workspace";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...dashboardHandlers,
  ...workflowHandlers,
  ...resourceHandlers,
  ...adminHandlers,
  ...auditHandlers,
  ...monitorHandlers,
  ...runHandlers,
  ...alertRuleHandlers,
  ...queryHandlers,
  ...workspaceHandlers,
];
