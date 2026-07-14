import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { workflowHandlers } from "./job";
import { manageHandlers } from "./manage";
import { auditHandlers } from "./audit";
import { monitorHandlers } from "./monitor";
import { runHandlers } from "./run";
import { alertRuleHandlers } from "./alert";
import { reactiveHandlers } from "./reactive";
import { workspaceHandlers } from "./workspace";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...dashboardHandlers,
  ...workflowHandlers,
  ...manageHandlers,
  ...auditHandlers,
  ...monitorHandlers,
  ...runHandlers,
  ...alertRuleHandlers,
  ...reactiveHandlers,
  ...workspaceHandlers,
];
