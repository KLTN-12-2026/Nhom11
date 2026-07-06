import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

type Variant = "success" | "error" | "info";

type ToastItem = { id: number; title: string; description?: string; variant: Variant };

type ToastInput = { title: string; description?: string; variant?: Variant };

type ToastContextValue = { toast: (input: ToastInput) => void };

interface ToastProviderProps {
  children: React.ReactNode;
}

const TOAST_DURATION_MS = 4000;

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const ACCENT = {
  success: "text-brand-600",
  error: "text-red-600",
  info: "text-neutral-500",
} as const;

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info" }: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => remove(id), TOAST_DURATION_MS);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              className="pointer-events-auto flex items-start gap-3 rounded-12 border border-neutral-200 bg-white p-3.5 shadow-card"
              key={t.id}
              role="status"
            >
              <Icon className={cn("mt-0.5 flex-shrink-0", ACCENT[t.variant])} size={17} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-neutral-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                aria-label="Dismiss"
                className="flex-shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
                onClick={() => remove(t.id)}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
