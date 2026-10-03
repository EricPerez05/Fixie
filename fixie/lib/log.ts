type Fields = Record<string, string | number | boolean | null | undefined>;

// One JSON line per event so Vercel's log search can filter on fields.
// SECURITY: callers pass outcomes and timings only. Never images, base64,
// keys or full model responses.
function write(level: "info" | "warn" | "error", event: string, fields: Fields): void {
  const line = JSON.stringify({ level, event, ...fields, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** Tiny structured logger. Never throws. */
export const log = {
  info: (event: string, fields: Fields = {}): void => write("info", event, fields),
  warn: (event: string, fields: Fields = {}): void => write("warn", event, fields),
  error: (event: string, fields: Fields = {}): void => write("error", event, fields),
};
