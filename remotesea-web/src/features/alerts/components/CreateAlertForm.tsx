import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useCategories } from "@/features/taxonomy/taxonomy.queries";
import {
  createAlertFormSchema,
  FREQUENCIES,
  JOB_TYPES,
  LEVELS,
  type CreateAlertFormValues,
} from "@/features/alerts/alerts.schemas";
import type { CreateAlertPayload } from "@/types/alert";

interface CreateAlertFormProps {
  onCreate: (payload: CreateAlertPayload) => Promise<void>;
}

const INPUT_FIELD_CLASS =
  "h-10 w-full rounded-10 border border-neutral-200 bg-white px-3 text-[13.5px] text-neutral-900 outline-none focus:border-brand-600";

const DEFAULT_FORM_VALUES: CreateAlertFormValues = {
  name: "",
  keywords: "",
  jobType: "",
  level: "",
  salaryMin: "",
  frequency: "DAILY",
  categoryIds: [],
};

export const CreateAlertForm = ({ onCreate }: CreateAlertFormProps) => {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAlertFormValues>({
    resolver: zodResolver(createAlertFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const categoryIds = watch("categoryIds");

  const toggleCategory = (categoryId: string) => {
    setValue(
      "categoryIds",
      categoryIds.includes(categoryId)
        ? categoryIds.filter((id) => id !== categoryId)
        : [...categoryIds, categoryId]
    );
  };

  const onSubmit = async (values: CreateAlertFormValues) => {
    await onCreate({
      name: values.name,
      keywords: values.keywords || undefined,
      jobType: values.jobType || undefined,
      level: values.level || undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      frequency: values.frequency,
      categoryIds: values.categoryIds.length ? values.categoryIds : undefined,
    });
    reset();
  };

  return (
    <form
      className="mb-8 space-y-4 rounded-16 border border-neutral-100 bg-white p-5 shadow-card"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-[14px] font-semibold text-neutral-900">Create a new alert</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            aria-label="Alert name"
            className={INPUT_FIELD_CLASS}
            placeholder="Alert name (e.g. Senior remote engineering)"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name.message}</p>}
        </div>
        <input
          aria-label="Keywords"
          className={INPUT_FIELD_CLASS}
          placeholder="Keywords (optional)"
          {...register("keywords")}
        />
        <select aria-label="Job type" className={INPUT_FIELD_CLASS} {...register("jobType")}>
          <option value="">Any job type</option>
          {JOB_TYPES.map((jobType) => (
            <option key={jobType} value={jobType}>
              {jobType.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select aria-label="Seniority level" className={INPUT_FIELD_CLASS} {...register("level")}>
          <option value="">Any level</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.toLowerCase()}
            </option>
          ))}
        </select>
        <input
          aria-label="Minimum salary"
          className={INPUT_FIELD_CLASS}
          min={0}
          placeholder="Min salary (USD/mo, optional)"
          type="number"
          {...register("salaryMin")}
        />
        <select aria-label="Notification frequency" className={INPUT_FIELD_CLASS} {...register("frequency")}>
          {FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {frequency.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const isSelected = categoryIds.includes(category.id);
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] transition-colors",
                  isSelected
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      <Button disabled={isSubmitting} type="submit">
        <Plus size={14} /> {isSubmitting ? "Creating…" : "Create alert"}
      </Button>
    </form>
  );
};
