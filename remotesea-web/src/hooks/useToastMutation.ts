import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";

interface ToastMutationMessages {
  success?: string;
  successDescription?: string;
  successVariant?: "success" | "info";
  error: string;
  errorDescription?: string;
}

export const useToastMutation = () => {
  const { toast } = useToast();

  return useCallback(
    async (action: () => Promise<unknown>, messages: ToastMutationMessages) => {
      try {
        await action();

        if (messages.success) {
          toast({
            variant: messages.successVariant ?? "success",
            title: messages.success,
            description: messages.successDescription,
          });
        }
      } catch {
        toast({
          variant: "error",
          title: messages.error,
          description: messages.errorDescription,
        });
      }
    },
    [toast]
  );
};
