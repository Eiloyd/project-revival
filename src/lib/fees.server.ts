// Server-side fee lookup: the admin's amount from payment_options, otherwise the default fee.
import { feeFor, type PaymentOptionKey } from "./payment-options";

let cache: { at: number; rows: { key: string; amount: number | null }[] } | null = null;

/** Current fee for a paid form (30-second cache; falls back to the default when the setting can't be read). */
export async function currentFee(key: PaymentOptionKey): Promise<number> {
  if (!cache || Date.now() - cache.at > 30_000) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin.from("payment_options").select("key, amount");
      cache = { at: Date.now(), rows: data ?? [] };
    } catch { cache = { at: Date.now(), rows: [] }; }
  }
  return feeFor(cache.rows, key);
}
