import { useQuery } from "@tanstack/react-query";
import { paymentOptionsQuery } from "@/lib/payment-options-query";
import { feeFor, type PaymentOptionKey } from "@/lib/payment-options";

/** Current fees: the admin's amounts where set, otherwise the defaults (also while loading or offline). */
export function useFees() {
  const { data } = useQuery(paymentOptionsQuery);
  return (key: PaymentOptionKey) => feeFor(data, key);
}
