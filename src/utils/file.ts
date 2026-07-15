/** Maximum file size in bytes (100 MB). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validate whether a file is within the allowed size limit.
 * Returns `true` if the file is acceptable, `false` otherwise.
 */
export function validateFileSize(fileSize: number, limit: number = MAX_FILE_SIZE): boolean {
  return fileSize <= limit;
}

/** Escape a single CSV field per RFC 4180 (quote when it holds a comma, quote, or newline). */
function csvField(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serialize tabular data to a CSV string and trigger a browser download.
 * `columns` sets the header row and column order; each row is read by column key.
 */
export function downloadCsv(
  filename: string,
  columns: string[],
  rows: Array<Record<string, unknown>>,
): void {
  const header = columns.map(csvField).join(",");
  const body = rows.map((row) => columns.map((col) => csvField(row[col])).join(",")).join("\n");
  // Prepend a UTF-8 BOM so Excel opens non-ASCII content (e.g. Chinese) without mojibake.
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
