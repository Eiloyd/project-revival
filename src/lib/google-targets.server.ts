// Which Google Sheet and Drive folder receive website copies (server only).
// The admin's choice is stored in the database; the project secrets are the fallback.

type Targets = { sheetId: string | null; driveFolderId: string | null; source: { sheet: "admin" | "default" | "none"; drive: "admin" | "default" | "none" } };
let cache: { at: number; value: Targets } | null = null;

export function forgetGoogleTargets() { cache = null; }

export async function getGoogleTargets(): Promise<Targets> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  let row: { sheet_id: string | null; drive_folder_id: string | null } | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    row = (await supabaseAdmin.from("google_copy_settings").select("sheet_id, drive_folder_id").eq("id", 1).maybeSingle()).data;
  } catch (e) { console.error("Google copy settings unavailable; using defaults", e); }
  const envSheet = process.env["EDUCATION_SHEET_ID"] || null;
  const envDrive = process.env["RILOYD_DRIVE_FOLDER_ID"] || null;
  const value: Targets = {
    sheetId: row?.sheet_id || envSheet,
    driveFolderId: row?.drive_folder_id || envDrive,
    source: { sheet: row?.sheet_id ? "admin" : envSheet ? "default" : "none", drive: row?.drive_folder_id ? "admin" : envDrive ? "default" : "none" },
  };
  cache = { at: Date.now(), value };
  return value;
}
