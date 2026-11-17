import { useEffect, useState } from "react";
import { REFERRAL_PARAM, REFERRAL_STORAGE_KEY, cleanReferralCode } from "@/lib/referral";

/** The referral code from ?ref= in the address, remembered for this browser tab so it survives moving between pages. */
export function useReferralCode(): string {
  const [code, setCode] = useState("");
  useEffect(() => {
    const fromUrl = cleanReferralCode(new URLSearchParams(window.location.search).get(REFERRAL_PARAM));
    try {
      if (fromUrl) sessionStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl);
      setCode(fromUrl || cleanReferralCode(sessionStorage.getItem(REFERRAL_STORAGE_KEY)));
    } catch { setCode(fromUrl); }
  }, []);
  return code;
}
