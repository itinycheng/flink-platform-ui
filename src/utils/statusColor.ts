// Unified tag coloring for entity `status` and `type`/category fields across the app.
// Use `statusColor` for values with good/bad semantics, `enumColor` for neutral categories.
// Both return Ant Design Tag color tokens (or preset palette names).

/** Semantic status → Ant Design Tag color token. Keyed by meaning, case-insensitive. */
const STATUS_COLOR: Record<string, string> = {
  // healthy / active
  success: "green",
  active: "green",
  online: "green",
  enabled: "green",
  ok: "green",
  // in progress
  running: "processing",
  scheduling: "processing",
  // waiting
  pending: "gold",
  waiting: "gold",
  // inactive / neutral
  offline: "default",
  disabled: "default",
  stopped: "default",
  inactive: "default",
  // failure
  failed: "error",
  error: "error",
  deleted: "red",
  // aborted / warning
  killed: "warning",
  timeout: "warning",
};

/** Color for a status-like value (active/online/success/failed/…). Falls back to neutral. */
export function statusColor(value: string | undefined | null): string {
  if (!value) return "default";
  return STATUS_COLOR[value.toLowerCase()] ?? "default";
}

// Categorical palette for neutral enums (type/role/channel/engine…). Deliberately excludes
// green/red so category colors never clash with status semantics.
const ENUM_PALETTE = ["blue", "geekblue", "purple", "cyan", "magenta", "gold", "lime", "volcano"];

/** Stable color for a neutral category value — the same string always maps to the same color. */
export function enumColor(value: string | undefined | null): string {
  if (!value) return "default";
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return ENUM_PALETTE[hash % ENUM_PALETTE.length];
}
