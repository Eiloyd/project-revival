import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { HERO_BUCKET, HERO_LINK_SECONDS, HERO_MAX_BYTES, heroImageFor, heroImagesQuery, heroImageTypes, heroPages, type HeroPage } from "@/lib/hero-images";
import { siteThemeLabels, siteThemes, type SiteTheme } from "@/lib/site-theme";

function Slot({ page, theme }: { page: HeroPage; theme: SiteTheme }) {
  const qc = useQueryClient();
  const { data } = useQuery({ ...heroImagesQuery, staleTime: 0 });
  const current = heroImageFor(data, page, theme);
  const row = data?.find(r => r.page === page && r.theme === theme);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: heroImagesQuery.queryKey });

  async function upload(file: File) {
    if (!(heroImageTypes as readonly string[]).includes(file.type)) { toast.error("Use a JPG, PNG or WebP picture."); return; }
    if (file.size > HERO_MAX_BYTES) { toast.error("The picture must be 5 MB or smaller."); return; }
    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${page}/${theme}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(HERO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error("The picture could not be uploaded. Check that the database update for hero pictures has been run.");
      // The picture folder is private (public folders are disabled for this workspace), so store a long-lived signed link.
      const { data: signed, error: signErr } = await supabase.storage.from(HERO_BUCKET).createSignedUrl(path, HERO_LINK_SECONDS);
      if (signErr || !signed?.signedUrl) { await supabase.storage.from(HERO_BUCKET).remove([path]); throw new Error("The picture link could not be created."); }
      const url = signed.signedUrl;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("hero_images").upsert({ page, theme, image_url: url, storage_path: path, updated_at: new Date().toISOString(), updated_by: user.user?.id ?? null });
      if (error) { await supabase.storage.from(HERO_BUCKET).remove([path]); throw new Error("The picture could not be saved."); }
      if (row?.storage_path && row.storage_path !== path) await supabase.storage.from(HERO_BUCKET).remove([row.storage_path]);
      await refresh();
      toast.success("Hero picture saved.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "The picture could not be saved."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!row) return;
    setBusy(true);
    const { error } = await supabase.from("hero_images").delete().eq("page", page).eq("theme", theme);
    if (error) toast.error("The picture could not be removed.");
    else { await supabase.storage.from(HERO_BUCKET).remove([row.storage_path]); await refresh(); toast.success("Removed. The original picture is back."); }
    setBusy(false);
  }

  return <div className="rounded-lg border border-border p-3">
    <p className="text-xs font-bold uppercase text-muted-foreground">{siteThemeLabels[theme]} theme</p>
    <div className="mt-2 grid aspect-[16/7] place-items-center overflow-hidden rounded-md bg-muted">
      {current ? <img src={current} alt={`${siteThemeLabels[theme]} hero`} className="h-full w-full object-cover" /> : <span className="px-2 text-center text-xs text-muted-foreground">Original picture</span>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <label className={`inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm font-medium ${busy ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>
        {busy ? "Please wait…" : current ? "Replace" : "Add picture"}
        <input type="file" accept={heroImageTypes.join(",")} className="sr-only" disabled={busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      </label>
      {current && <Button type="button" variant="outline" size="sm" className="h-9" disabled={busy} onClick={() => void remove()}>Remove</Button>}
    </div>
  </div>;
}

export function HeroImagesAdmin() {
  return <section>
    <h2 className="text-xl font-bold">Hero pictures</h2>
    <p className="mt-2 text-sm text-muted-foreground">Choose the large top picture for each page and theme. JPG, PNG or WebP up to 5 MB; a wide picture (about 1920 × 800) works best. Remove a picture to bring back the original.</p>
    {heroPages.map(p => <div key={p.key} className="mt-6">
      <h3 className="font-bold">{p.label}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">{siteThemes.map(t => <Slot key={t} page={p.key} theme={t} />)}</div>
    </div>)}
  </section>;
}
