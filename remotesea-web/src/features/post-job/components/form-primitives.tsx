import { Children, cloneElement, isValidElement, useId } from "react";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

interface AssociableFieldProps {
  id?: string;
}

export const Field = ({ label, children, hint }: FieldProps) => {
  const generatedId = useId();
  const child = Children.only(children);
  const canAssociate =
    isValidElement<AssociableFieldProps>(child) &&
    (child.type === Input || child.type === Select || child.type === Textarea ||
      child.type === "input" || child.type === "select" || child.type === "textarea");

  const fieldId = canAssociate ? (child.props.id ?? generatedId) : undefined;
  const associatedChild = canAssociate ? cloneElement(child, { id: fieldId }) : children;

  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-neutral-700" htmlFor={fieldId}>
        {label}
      </label>
      {associatedChild}
      {hint && <p className="text-[11.5px] text-neutral-400">{hint}</p>}
    </div>
  );
};

interface InputProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

export const Input = ({ id, value, onChange, placeholder, type = "text" }: InputProps) => (
  <input
    className="w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    id={id}
    placeholder={placeholder}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

interface SelectProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}

export const Select = ({ id, value, onChange, options }: SelectProps) => (
  <select
    className="w-full rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

interface TextareaProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export const Textarea = ({ id, value, onChange, placeholder, rows = 4 }: TextareaProps) => (
  <textarea
    className="w-full resize-none rounded-10 border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    id={id}
    placeholder={placeholder}
    rows={rows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);
