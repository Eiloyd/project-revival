// Server-only failure logging for database, storage and Google backup operations.
// Logs the error code, message, failed operation/table and a reference ID — never form contents, keys or tokens.

export type FailureKind = "setup" | "settings" | "network" | "other";

export type FailureInfo = { code: string; message: string; kind: FailureKind };

/** Postgres / Data API codes that mean the database structure or its access grants are missing. */
const SETUP_CODES = new Set([
  "42501", // permission denied (missing GRANT)
  "42P01", // table does not exist
  "42883", // function does not exist
  "42703", // column does not exist
  "PGRST202", // function not found in the Data API
  "PGRST204", // column not found in the Data API
  "PGRST205", // table not found in the Data API
  "P0001", // raised by a database function, e.g. an acknowledgement counter that was never seeded
]);

export function referenceId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

function field(error: unknown, key: string): string {
  if (error && typeof error === "object" && key in error) {
    const value = (error as Record<string, unknown>)[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  }
  return "";
}

/** Error details safe for logs: database `details` are left out because they can echo submitted values. */
export function describeFailure(error: unknown): FailureInfo {
  const code = field(error, "code") || field(error, "statusCode") || field(error, "status");
  const rawMessage = error instanceof Error ? error.message : field(error, "message") || (typeof error === "string" ? error : "Unknown error");
  const message = rawMessage.replace(/(eyJ[\w-]+\.[\w-]+\.[\w-]+|sb_(secret|publishable)_[\w-]+)/g, "[redacted]").slice(0, 300);
  let kind: FailureKind = "other";
  if (SETUP_CODES.has(code) || /permission denied|does not exist|schema cache|Unknown form code/i.test(message)) kind = "setup";
  else if (/Missing Supabase environment variable|Missing .*(KEY|URL)|Invalid API key|No API key|JWT|EDUCATION_KYC_ENCRYPTION_KEY|Secure identity storage is unavailable/i.test(message) || code === "401" || code === "403") kind = "settings";
  else if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|timed? ?out/i.test(message)) kind = "network";
  return { code: code || "none", message, kind };
}

/** Writes one structured log line and returns the reference ID shown to the visitor. */
export function logFailure(operation: string, target: string, error: unknown, ref: string = referenceId()): { ref: string } & FailureInfo {
  const info = describeFailure(error);
  console.error(JSON.stringify({ level: "error", event: "db_failure", ref, operation, target, code: info.code, kind: info.kind, message: info.message }));
  return { ref, ...info };
}

/** Visitor-facing text: the original safe message, a reference ID and, for setup problems, a plain hint. */
export function visitorMessage(message: string, info: { ref: string; kind: FailureKind }): string {
  const hint = info.kind === "setup" ? " The website's database setup is incomplete." : info.kind === "settings" ? " The website's server settings are incomplete." : "";
  return `${message}${hint} Reference: ${info.ref}`;
}

/** Logs the failure and returns an Error whose message is safe to show the visitor. */
export function submissionFailure(message: string, operation: string, target: string, error: unknown, ref?: string): Error {
  return new Error(visitorMessage(message, logFailure(operation, target, error, ref)));
}
