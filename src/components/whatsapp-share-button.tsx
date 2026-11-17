import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappShareUrl } from "@/lib/share/whatsapp";

/** Opens WhatsApp with a ready message so staff can send a link in one tap. */
export function WhatsAppShareButton({ text, label = "WhatsApp" }: { text: string; label?: string }) {
  return <Button size="sm" variant="outline" asChild><a href={whatsappShareUrl(text)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} />{label}</a></Button>;
}
