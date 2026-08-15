import type { Status } from "@/constants/enums";

export type WorkspaceStatus = Status;

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  status: WorkspaceStatus;
  /** The system default workspace — its display name is localized instead of using `name`. */
  isDefault?: boolean;
  createdAt: string;
}
