import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FolderPlus, Link2, RefreshCw, Sheet, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { folderUrl, sheetUrl } from "@/lib/google-links";
import { autoCreateDriveFolder, autoCreateSheet, copyEverythingAgain, copyNow, getGoogleSettings, chooseDriveFolderLink, chooseSheetLink } from "@/lib/google-settings.functions";

const KEY = ["admin", "google-copy-settings"] as const;
const sourceLabel = { admin: "chosen here", default: "project default", none: "not chosen" } as const;

export function GoogleCopyAdmin() {
  const load = useServerFn(getGoogleSettings);
  const { data, error, isPending } = useQuery({ queryKey: KEY, queryFn: () => load() });
  const queryClient = useQueryClient();
  const [sheetLink, setSheetLink] = useState("");
  const [folderLink, setFolderLink] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const fns = {
    sheet: useServerFn(chooseSheetLink), newSheet: useServerFn(autoCreateSheet), folder: useServerFn(chooseDriveFolderLink),
    newFolder: useServerFn(autoCreateDriveFolder), again: useServerFn(copyEverythingAgain), now: useServerFn(copyNow),
  };

  async function act(name: string, run: () => Promise<string>) {
    setBusy(name); setMessage("");
    try { setMessage(await run()); await queryClient.invalidateQueries({ queryKey: KEY }); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setBusy(""); }
  }

  const connected = data?.connected;
  return <section className="mt-8 min-w-0">
    <h2 className="flex items-center gap-2 text-xl font-extrabold"><Sheet size={20} /> Google Sheet &amp; Drive</h2>
    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Every website form is copied to one Google Sheet. Every uploaded document or video (resumes, request attachments, funding, finance, CRM and manpower files, reports and registration documents) is saved to one Drive folder, and its Drive link is listed in the Sheet's "Uploaded files" tab. Website pictures and volunteer identity proofs stay only on the website. The website's own records stay as they are; the Sheet is a copy.</p>
    {error ? <p role="alert" className="mt-4 text-sm">{error instanceof Error ? error.message : "Settings could not be loaded."}</p> : isPending || !data ? <p className="mt-4 text-sm">Loading…</p> : <>
      {(!connected?.sheets || !connected.drive) && <p role="alert" className="mt-4 rounded-md border border-border p-3 text-sm">
        {!connected?.sheets && "Google Sheets is not connected yet, so copying and auto setup cannot run. "}
        {!connected?.drive && "Google Drive is not connected yet, so documents are not copied. "}
        Ask your Lovable builder to connect the Google account.
      </p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-md border border-border p-5">
          <h3 className="font-bold">Google Sheet</h3>
          {data.sheetId ? <p className="mt-2 break-all text-sm"><a className="inline-flex items-center gap-1 underline" href={sheetUrl(data.sheetId)} target="_blank" rel="noreferrer">{data.sheetTitle || "Open current Sheet"} <ExternalLink size={12} /></a><span className="block text-xs text-muted-foreground">{data.sheetId} · {sourceLabel[data.sheetSource]}</span></p> : <p className="mt-2 text-sm text-muted-foreground">No Sheet chosen.</p>}
          <form className="mt-4 grid gap-2" onSubmit={e => { e.preventDefault(); void act("sheet", async () => { const r = await fns.sheet({ data: { link: sheetLink } }); setSheetLink(""); return `Now using “${r.title || r.id}”. Missing tabs were added; ${r.queued} records will be copied in the next few minutes.`; }); }}>
            <Label htmlFor="sheet-link">Change Sheet by link</Label>
            <Input id="sheet-link" value={sheetLink} onChange={e => setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
            <p className="text-xs text-muted-foreground">Share the Sheet with the connected Google account as Editor first.</p>
            <Button type="submit" disabled={!!busy || !sheetLink.trim()}><Link2 size={16} />{busy === "sheet" ? "Checking…" : "Use this Sheet"}</Button>
          </form>
          <Button className="mt-3 w-full" variant="outline" disabled={!!busy} onClick={() => { if (window.confirm("Create a fresh Google Sheet with all tabs and copy every record into it?")) void act("newSheet", async () => { const r = await fns.newSheet(); return `Created “${r.title}”${r.inFolder ? " inside the Drive folder" : ""}. ${r.queued} records will be copied in the next few minutes.`; }); }}><Wand2 size={16} />{busy === "newSheet" ? "Creating…" : "Auto setup: create a fresh Sheet"}</Button>
        </article>

        <article className="rounded-md border border-border p-5">
          <h3 className="font-bold">Google Drive folder</h3>
          {data.driveFolderId ? <p className="mt-2 break-all text-sm"><a className="inline-flex items-center gap-1 underline" href={folderUrl(data.driveFolderId)} target="_blank" rel="noreferrer">{data.driveFolderTitle || "Open current folder"} <ExternalLink size={12} /></a><span className="block text-xs text-muted-foreground">{data.driveFolderId} · {sourceLabel[data.driveSource]}</span></p> : <p className="mt-2 text-sm text-muted-foreground">No folder chosen.</p>}
          <form className="mt-4 grid gap-2" onSubmit={e => { e.preventDefault(); void act("folder", async () => { const r = await fns.folder({ data: { link: folderLink } }); setFolderLink(""); return `Now saving documents to “${r.title || r.id}”.`; }); }}>
            <Label htmlFor="folder-link">Change folder by link</Label>
            <Input id="folder-link" value={folderLink} onChange={e => setFolderLink(e.target.value)} placeholder="https://drive.google.com/drive/folders/…" />
            <Button type="submit" disabled={!!busy || !folderLink.trim()}><Link2 size={16} />{busy === "folder" ? "Checking…" : "Use this folder"}</Button>
          </form>
          <Button className="mt-3 w-full" variant="outline" disabled={!!busy} onClick={() => void act("newFolder", async () => { const r = await fns.newFolder(); return `Created Drive folder “${r.title}”.`; })}><FolderPlus size={16} />{busy === "newFolder" ? "Creating…" : "Auto setup: create a fresh folder"}</Button>
        </article>
      </div>

      <div className="mt-6 rounded-md border border-border p-5">
        <h3 className="font-bold">Copying</h3>
        <p className="mt-2 text-sm">{data.waiting} records waiting to be copied. New records are copied automatically every few minutes.</p>
        {data.lastError && <p className="mt-2 break-words text-sm text-destructive">Last problem: {data.lastError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => void act("now", async () => { const r = await fns.now(); return r.failures.length ? `Copied ${r.rows} records and ${r.documents} documents. Problem: ${r.failures[0]}` : `Copied ${r.rows} records and ${r.documents} documents.`; })}><RefreshCw size={16} className={busy === "now" ? "animate-spin" : ""} />{busy === "now" ? "Copying…" : "Copy now"}</Button>
          <Button variant="outline" disabled={!!busy} onClick={() => void act("again", async () => { const r = await fns.again({ data: { documents: false } }); return `${r.queued} records queued to copy again.`; })}>Copy all records again</Button>
          <Button variant="outline" disabled={!!busy} onClick={() => { if (window.confirm("Upload every applicant document to the current Drive folder again? This can create duplicate files.")) void act("againDocs", async () => { const r = await fns.again({ data: { documents: true } }); return `${r.queued} records and all documents queued to copy again.`; }); }}>Copy records and documents again</Button>
        </div>
      </div>
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    </>}
  </section>;
}
