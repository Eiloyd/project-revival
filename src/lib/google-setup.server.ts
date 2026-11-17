// Admin Google setup: check, prepare or create the website Sheet and Drive folder (server only).
import { ID_HEADER, MIRROR_TABS } from "./google-mirror";
import { SHEET_TAB, sheetHeaders } from "./education-support/sheet";
import { columnLetter } from "./google-mirror";

const BASE = "https://connector-gateway.lovable.dev";
export const SHEET_NAME = "RILOYD Website Data";
export const FOLDER_NAME = "RILOYD Website Documents";

export function googleConnected() {
  return { sheets: Boolean(process.env["GOOGLE_SHEETS_API_KEY"]), drive: Boolean(process.env["GOOGLE_DRIVE_API_KEY"]), gateway: Boolean(process.env["LOVABLE_API_KEY"]) };
}

async function call<T>(service: "sheets" | "drive", url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const key = process.env[service === "sheets" ? "GOOGLE_SHEETS_API_KEY" : "GOOGLE_DRIVE_API_KEY"];
  if (!lovableKey || !key) throw new Error(service === "sheets" ? "Google Sheets is not connected to this website yet." : "Google Drive is not connected to this website yet.");
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": key, "Content-Type": "application/json" },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Google ${service} request failed [${res.status}]: ${text}`);
    if (res.status === 404 || res.status === 403) throw new Error(service === "sheets"
      ? `Google says this Sheet cannot be opened [${res.status}]. Share it with the connected Google account as Editor, then try again.`
      : `Google says this Drive folder cannot be opened [${res.status}]. Share it with the connected Google account as Editor, then try again.`);
    throw new Error(`Google ${service} request failed [${res.status}]: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

type SheetMeta = { properties?: { title?: string }; sheets?: { properties?: { title?: string } }[] };
const quoted = (tab: string) => `'${tab.replace(/'/g, "''")}'`;
const wantedTabs = () => [SHEET_TAB, ...Object.values(MIRROR_TABS).map(t => t.tab)];

/** Opens the Sheet, adds any missing tabs and empty header rows. Existing tabs and data are never changed. Returns the title. */
export async function prepareSheet(sheetId: string): Promise<string> {
  const url = `${BASE}/google_sheets/v4/spreadsheets/${sheetId}`;
  const meta = await call<SheetMeta>("sheets", `${url}?fields=properties.title,sheets.properties.title`);
  const have = new Set((meta.sheets ?? []).map(s => s.properties?.title ?? ""));
  const missing = wantedTabs().filter(t => !have.has(t));
  if (missing.length) await call("sheets", `${url}:batchUpdate`, { method: "POST", body: { requests: missing.map(title => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })) } });
  if (missing.length) {
    const responses = sheetHeaders();
    const data = missing.map(tab => tab === SHEET_TAB
      ? { range: `${quoted(tab)}!A1:${columnLetter(responses.length)}1`, values: [responses] }
      : { range: `${quoted(tab)}!A1:A1`, values: [[ID_HEADER]] });
    await call("sheets", `${url}/values:batchUpdate`, { method: "POST", body: { valueInputOption: "RAW", data } });
  }
  return meta.properties?.title ?? "";
}

/** Creates a fresh Sheet with every tab, optionally inside the Drive folder. */
export async function createSheet(folderId: string | null): Promise<{ id: string; title: string; inFolder: boolean }> {
  const title = `${SHEET_NAME} ${new Date().toISOString().slice(0, 10)}`;
  const created = await call<{ spreadsheetId: string }>("sheets", `${BASE}/google_sheets/v4/spreadsheets`, {
    method: "POST", body: { properties: { title }, sheets: wantedTabs().map(t => ({ properties: { title: t, gridProperties: { frozenRowCount: 1 } } })) },
  });
  await prepareSheet(created.spreadsheetId);
  let inFolder = false;
  if (folderId && googleConnected().drive) {
    try {
      const file = await call<{ parents?: string[] }>("drive", `${BASE}/google_drive/drive/v3/files/${created.spreadsheetId}?fields=parents`);
      const remove = (file.parents ?? []).join(",");
      await call("drive", `${BASE}/google_drive/drive/v3/files/${created.spreadsheetId}?addParents=${folderId}${remove ? `&removeParents=${remove}` : ""}&fields=id`, { method: "PATCH", body: {} });
      inFolder = true;
    } catch (e) { console.error("New sheet could not be moved into the Drive folder", e); }
  }
  return { id: created.spreadsheetId, title, inFolder };
}

/** Checks a Drive folder is reachable and is a folder. Returns its name. */
export async function checkFolder(folderId: string): Promise<string> {
  const f = await call<{ name?: string; mimeType?: string; trashed?: boolean }>("drive", `${BASE}/google_drive/drive/v3/files/${folderId}?fields=name,mimeType,trashed&supportsAllDrives=true`);
  if (f.mimeType !== "application/vnd.google-apps.folder") throw new Error("This Drive link is not a folder. Paste the link of a Google Drive folder.");
  if (f.trashed) throw new Error("This Drive folder is in the bin. Restore it or choose another folder.");
  return f.name ?? "";
}

export async function createFolder(): Promise<{ id: string; title: string }> {
  const created = await call<{ id: string; name?: string }>("drive", `${BASE}/google_drive/drive/v3/files?fields=id,name`, {
    method: "POST", body: { name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
  });
  return { id: created.id, title: created.name ?? FOLDER_NAME };
}
