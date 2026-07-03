import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/utils/cn";
import { useCategories } from "@/features/taxonomy/taxonomy.queries";
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useSetAlertActive,
} from "@/features/alerts/alerts.queries";
import {
  createAlertFormSchema,
  FREQUENCIES,
  JOB_TYPES,
  LEVELS,
  type CreateAlertFormValues,
} from "@/features/alerts/alerts.schemas";
import type { JobAlert } from "@/types/alert";

const inputCls =
  "h-10 w-full rounded-10 border border-neutral-200 bg-white px-3 text-[13.5px] text-neutral-900 outline-none focus:border-brand-600";

function summarize(a: JobAlert): string {
  return (
    [
      a.keywords,
      a.jobType?.replace("_", " ").toLowerCase(),
      a.level?.toLowerCase(),
      a.salaryMin ? `$${a.salaryMin}+/mo` : null,
      a.frequency.toLowerCase(),
      ...a.categories.map((c) => c.category.name),
    ]
      .filter(Boolean)
      .join(" · ") || "All jobs"
  );
}

export function AlertsManager() {
  const { toast } = useToast();
  const { data: alerts, isLoading } = useAlerts();
  const { data: categories } = useCategories();
  const createAlert = useCreateAlert();
  const setActive = useSetAlertActive();
  const deleteAlert = useDeleteAlert();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAlertFormValues>({
    resolver: zodResolver(createAlertFormSchema),
    defaultValues: {
      name: "",
      keywords: "",
      jobType: "",
      level: "",
      salaryMin: "",
      frequency: "DAILY",
      categoryIds: [],
    },
  });

  const categoryIds = watch("categoryIds");

  async function onSubmit(values: CreateAlertFormValues) {
    try {
      await createAlert.mutateAsync({
        name: values.name,
        keywords: values.keywords || undefined,
        jobType: values.jobType || undefined,
        level: values.level || undefined,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        frequency: values.frequency,
        categoryIds: values.categoryIds.length ? values.categoryIds : undefined,
      });
      toast({ variant: "success", title: "Alert created", description: "We'll email you matching jobs." });
      reset();
    } catch {
      toast({ variant: "error", title: "Couldn't create alert" });
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      await setActive.mutateAsync({ id, isActive });
    } catch {
      toast({ variant: "error", title: "Couldn't update alert" });
    }
  }

  async function remove(id: string) {
    try {
      await deleteAlert.mutateAsync(id);
      toast({ variant: "success", title: "Alert deleted" });
    } catch {
      toast({ variant: "error", title: "Couldn't delete alert" });
    }
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-[28px] font-semibold tracking-tight text-neutral-900">Job alerts</h1>
        <p className="text-[15px] text-neutral-500">
          Get notified when new jobs match your criteria. We email you on your chosen schedule.
        </p>
      </div>

      {/* Create form */}
      <form
        className="mb-8 space-y-4 rounded-16 border border-neutral-100 bg-white p-5 shadow-card"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-[14px] font-semibold text-neutral-900">Create a new alert</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <input
              className={inputCls}
              placeholder="Alert name (e.g. Senior remote engineering)"
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name.message}</p>}
          </div>
          <input className={inputCls} placeholder="Keywords (optional)" {...register("keywords")} />
          <select className={inputCls} {...register("jobType")}>
            <option value="">Any job type</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
          <select className={inputCls} {...register("level")}>
            <option value="">Any level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.toLowerCase()}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            min={0}
            placeholder="Min salary (USD/mo, optional)"
            type="number"
            {...register("salaryMin")}
          />
          <select className={inputCls} {...register("frequency")}>
            {FREQUENCIES.map((fr) => (
              <option key={fr} value={fr}>
                {fr.toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = categoryIds.includes(c.id);
              return (
                <button
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] transition-colors",
                    on
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  )}
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setValue(
                      "categoryIds",
                      on ? categoryIds.filter((x) => x !== c.id) : [...categoryIds, c.id]
                    )
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        <Button disabled={isSubmitting} type="submit">
          <Plus size={14} /> {isSubmitting ? "Creating…" : "Create alert"}
        </Button>
      </form>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="py-8 text-center text-[13px] text-neutral-400">Loading alerts…</p>
        ) : !alerts || alerts.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-neutral-400">
            No alerts yet. Create one above to start getting matched jobs.
          </p>
        ) : (
          alerts.map((a) => (
            <div className="flex items-center gap-4 rounded-16 border border-neutral-100 bg-white p-4 shadow-card" key={a.id}>
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Bell size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-neutral-900">{a.name}</p>
                <p className="truncate text-[12px] text-neutral-400">{summarize(a)}</p>
              </div>
              <button
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  a.isActive ? "bg-brand-50 text-brand-700" : "bg-neutral-100 text-neutral-500"
                )}
                type="button"
                onClick={() => toggle(a.id, !a.isActive)}
              >
                {a.isActive ? "Active" : "Paused"}
              </button>
              <button
                aria-label="Delete alert"
                className="grid h-8 w-8 place-items-center rounded-8 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                type="button"
                onClick={() => remove(a.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
