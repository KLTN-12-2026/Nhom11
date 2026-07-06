import type { UseFormRegisterReturn } from "react-hook-form";

interface TextFieldProps {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  type?: string;
  placeholder?: string;
  error?: string;
  labelSlot?: React.ReactNode;
}

export const TextField = ({
  id,
  label,
  registration,
  type = "text",
  placeholder,
  error,
  labelSlot,
}: TextFieldProps) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <label className="block text-sm font-medium text-neutral-700" htmlFor={id}>
        {label}
      </label>
      {labelSlot}
    </div>
    <input
      aria-invalid={!!error}
      className="h-11 w-full rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-brand-600 focus:shadow-focus"
      id={id}
      placeholder={placeholder}
      type={type}
      {...registration}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
