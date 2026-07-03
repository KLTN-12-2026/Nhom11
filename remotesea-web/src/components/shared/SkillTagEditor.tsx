import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useSkills } from "@/features/taxonomy/taxonomy.queries";

type SkillTagEditorProps = {
  skills: string[];
  setSkills: (skills: string[]) => void;
};

export function SkillTagEditor({ skills, setSkills }: SkillTagEditorProps) {
  const [val, setVal] = useState("");
  const { data: allSkills } = useSkills();

  const add = (s: string) => {
    const t = s.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setVal("");
  };

  const suggested = (allSkills ?? []).map((s) => s.name).filter((name) => !skills.includes(name));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 rounded-12 border border-neutral-200 bg-white p-2.5">
        {skills.map((s) => (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12.5px] text-neutral-800"
            key={s}
          >
            {s}
            <button
              className="text-neutral-400 hover:text-neutral-700"
              type="button"
              onClick={() => setSkills(skills.filter((x) => x !== s))}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 px-1.5 py-0.5 text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          placeholder={skills.length === 0 ? "Type a skill and press Enter…" : "Add another…"}
          value={val}
          onBlur={() => {
            if (val.trim()) add(val);
          }}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(val);
            }
            if (e.key === "Backspace" && val === "" && skills.length > 0) {
              setSkills(skills.slice(0, -1));
            }
          }}
        />
      </div>
      {suggested.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-neutral-400">Suggested:</span>
          {suggested.slice(0, 6).map((s) => (
            <button
              className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[11.5px] text-neutral-600 hover:border-brand-300 hover:text-brand-700"
              key={s}
              type="button"
              onClick={() => add(s)}
            >
              <Plus className="mr-1 inline" size={9} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
