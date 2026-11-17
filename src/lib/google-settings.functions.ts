// Admin-only: choose, check or auto-create the Google Sheet and Drive folder that receive website copies.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseDriveFolderId, parseSpreadsheetId } from "./google-links";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

async function requireAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Admin access required.");
}

async function save(context: Ctx, patch: { sheet_id?: string; sheet_title?: string; drive_folder_id?: string; drive_folder_title?: string }) {
  const { error } = await context.supabase.from("google_copy_settings").upsert({ id: 1, ...patch, updated_at: new Date().toISOString(), updated_by: context.userId });
  if (error) throw new Error("The choice could not be saved. Please try again.");
  const { forgetGoogleTargets } = await import("./google-targets.server");
  forgetGoogleTargets();
}

/** Re-queues every record for copying. Server-only database function: the caller's admin role is checked first. */
async function requeue(context: Ctx, documents: boolean) {
  await requireAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("requeue_all_google_copies", { _include_documents: documents });
  if (error) throw new Error("Records could not be queued for copying.");
  return data ?? 0;
}

export const getGoogleSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context);
  const { getGoogleTargets, forgetGoogleTargets } = await import("./google-targets.server");
  const { googleConnected } = await import("./google-setup.server");
  forgetGoogleTargets();
  const targets = await getGoogleTargets();
  const { data: row } = await context.supabase.from("google_copy_settings").select("sheet_title, drive_folder_title, updated_at").eq("id", 1).maybeSingle();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: queue } = await supabaseAdmin.from("sheet_mirror_queue").select("last_error, attempts").limit(1000);
  const failing = (queue ?? []).filter(q => q.attempts > 0);
  return {
    sheetId: targets.sheetId, sheetTitle: row?.sheet_title ?? "", sheetSource: targets.source.sheet,
    driveFolderId: targets.driveFolderId, driveFolderTitle: row?.drive_folder_title ?? "", driveSource: targets.source.drive,
    updatedAt: row?.updated_at ?? null, connected: googleConnected(),
    waiting: queue?.length ?? 0, lastError: failing[0]?.last_error ?? "",
  };
});

export const chooseSheetLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ link: z.string().trim().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const id = parseSpreadsheetId(data.link);
    if (!id) throw new Error("This is not a Google Sheet link. Paste a link that starts with https://docs.google.com/spreadsheets/d/");
    const { prepareSheet } = await import("./google-setup.server");
    const title = await prepareSheet(id);
    await save(context, { sheet_id: id, sheet_title: title });
    const queued = await requeue(context, false);
    return { id, title, queued };
  });

export const autoCreateSheet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context);
  const { getGoogleTargets } = await import("./google-targets.server");
  const { createSheet } = await import("./google-setup.server");
  const created = await createSheet((await getGoogleTargets()).driveFolderId);
  await save(context, { sheet_id: created.id, sheet_title: created.title });
  const queued = await requeue(context, false);
  return { ...created, queued };
});

export const chooseDriveFolderLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ link: z.string().trim().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const id = parseDriveFolderId(data.link);
    if (!id) throw new Error("This is not a Google Drive folder link. Paste a link like https://drive.google.com/drive/folders/…");
    const { checkFolder } = await import("./google-setup.server");
    const title = await checkFolder(id);
    await save(context, { drive_folder_id: id, drive_folder_title: title });
    return { id, title };
  });

export const autoCreateDriveFolder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context);
  const { createFolder } = await import("./google-setup.server");
  const created = await createFolder();
  await save(context, { drive_folder_id: created.id, drive_folder_title: created.title });
  return created;
});

export const copyEverythingAgain = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documents: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return { queued: await requeue(context, data.documents) };
  });

export const copyNow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context);
  const { runGoogleMirror } = await import("./google-mirror.server");
  return runGoogleMirror();
});
