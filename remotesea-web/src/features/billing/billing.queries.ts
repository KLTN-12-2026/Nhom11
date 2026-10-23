import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/features/billing/billing.api";

export const useCreateCheckoutSession = () => useMutation({ mutationFn: createCheckoutSession });
