/** Formats seconds into M:SS display format. */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds < 0) {
    return '-';
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins)}:${String(secs).padStart(2, '0')}`;
};

/** Default date formatter using Intl.DateTimeFormat. */
export const formatDate = (value: string | Date | null | undefined): string => {
  if (value == null) {
    return '-';
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/** Format bytes to a human-readable string */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
