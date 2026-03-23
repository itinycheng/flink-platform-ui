import type { RequestHandler } from 'msw'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { workflowHandlers } from './job'
import { manageHandlers } from './manage'
import { monitorHandlers } from './monitor'

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...dashboardHandlers,
  ...workflowHandlers,
  ...manageHandlers,
  ...monitorHandlers,
]
