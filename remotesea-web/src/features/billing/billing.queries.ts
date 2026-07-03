import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/features/billing/billing.api";

export function useCreateCheckoutSession() {
  return useMutation({ mutationFn: createCheckoutSession });
}
