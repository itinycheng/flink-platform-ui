/** Maximum file size in bytes (100 MB). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validate whether a file is within the allowed size limit.
 * Returns `true` if the file is acceptable, `false` otherwise.
 */
export function validateFileSize(fileSize: number, limit: number = MAX_FILE_SIZE): boolean {
  return fileSize <= limit;
}
