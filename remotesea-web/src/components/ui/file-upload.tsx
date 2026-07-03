import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { uploadViaPresign, type UploadType } from "@/services/uploads.api";

export function FileUpload({
  type,
  accept,
  label,
  value,
  onUploaded,
}: {
  type: UploadType;
  accept: string;
  label: string;
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">(
    value ? "done" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    setError(null);
    try {
      const url = await uploadViaPresign(file, type);
      onUploaded(url);
      setState("done");
    } catch {
      setState("error");
      setError("Upload failed. Try again.");
    }
  }

  return (
    <div className="space-y-1.5">
      <input
        accept={accept}
        className="hidden"
        ref={inputRef}
        type="file"
        onChange={handleChange}
      />
      <button
        className="rounded-10 inline-flex items-center gap-2 border border-neutral-200 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-60"
        disabled={state === "uploading"}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {state === "done" ? <Check className="text-brand-600" size={14} /> : <Upload size={14} />}
        {state === "uploading" ? "Uploading…" : state === "done" ? `${label} uploaded` : label}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
