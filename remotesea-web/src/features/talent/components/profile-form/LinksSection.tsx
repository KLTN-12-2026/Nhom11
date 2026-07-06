import type { UseFormRegister } from "react-hook-form";
import { Briefcase, Code2, Globe, User } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { SectionHead, EMPHASIS_STYLE } from "@/features/talent/components/profile-form/SectionHead";
import type { ProfileFormValues } from "@/features/talent/talent.schemas";

const LINK_FIELDS = [
  { icon: Code2, label: "GitHub", field: "githubUrl" as const, placeholder: "github.com/you" },
  { icon: User, label: "LinkedIn", field: "linkedinUrl" as const, placeholder: "linkedin.com/in/you" },
  {
    icon: Globe,
    label: "Portfolio / personal site",
    field: "portfolioUrl" as const,
    placeholder: "https://",
  },
];

interface LinksSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  resumeUrl: string;
  onResumeUploaded: (url: string) => void;
}

export const LinksSection = ({ register, resumeUrl, onResumeUploaded }: LinksSectionProps) => (
  <section className="rounded-20 scroll-mt-6 border border-neutral-100 bg-white p-7" id="links">
    <SectionHead
      eyebrow="06 · Where to look"
      help="Attach your CV and a couple of links. Hiring managers want to read your writing or code."
      title={
        <>
          Links &amp;{" "}
          <em className="font-serif italic text-brand-700" style={EMPHASIS_STYLE}>
            CV.
          </em>
        </>
      }
    />
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="rounded-10 flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-100 text-neutral-500">
          <Briefcase size={15} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <label className="block text-[12px] font-medium text-neutral-700">CV / Resume (PDF)</label>
          <FileUpload
            accept="application/pdf"
            label="Upload CV"
            type="resume"
            value={resumeUrl}
            onUploaded={onResumeUploaded}
          />
        </div>
      </div>

      {LINK_FIELDS.map(({ icon: Icon, label, field, placeholder }) => (
        <div className="flex items-center gap-3" key={field}>
          <span className="rounded-10 flex h-9 w-9 flex-shrink-0 items-center justify-center bg-neutral-100 text-neutral-500">
            <Icon size={15} />
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <label className="block text-[12px] font-medium text-neutral-700">{label}</label>
            <input
              className="rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder={placeholder}
              {...register(field)}
            />
          </div>
        </div>
      ))}
    </div>
  </section>
);
