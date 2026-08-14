const DURATION_RE = /^(\d+(s|m|h|d))+$/;

/** True when `v` is a backend-style duration such as "5s", "1m", "2h30m". */
export function isValidDuration(v: string): boolean {
  return DURATION_RE.test(v);
}
