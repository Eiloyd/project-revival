// Browser-safe share helpers (tested): WhatsApp share links and CSV export text.
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
}

/** One quoted CSV cell; formula-looking text gets a leading quote, real numbers stay numbers. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV text with quoted cells; formula-looking cells get a leading quote so spreadsheets don't run them. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const cell = csvCell;
  return [keys.map(cell).join(","), ...rows.map(r => keys.map(k => cell(r[k])).join(","))].join("\r\n");
}

const SKIP_HEADERS = new Set(["", "actions", "action", "review"]);
/** Table cells → CSV rows; drops button columns (blank or "Actions" header) and collapses whitespace. */
export function tableCellsToRows(head: string[], rows: string[][]): Record<string, string>[] {
  const keep = head.map((h, i) => [h.trim(), i] as const).filter(([h]) => !SKIP_HEADERS.has(h.toLowerCase()));
  return rows.map(r => Object.fromEntries(keep.map(([h, i]) => [h, (r[i] ?? "").replace(/\s+/g, " ").trim()])));
}
