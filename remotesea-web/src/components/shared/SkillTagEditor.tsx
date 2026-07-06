import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useSkills } from "@/features/taxonomy/taxonomy.queries";

interface SkillTagEditorProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
}

const MAX_SUGGESTIONS = 6;

export const SkillTagEditor = ({ skills, setSkills }: SkillTagEditorProps) => {
  const [inputValue, setInputValue] = useState("");
  const { data: allSkills } = useSkills();

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setInputValue("");
  };

  const removeLastSkill = () => setSkills(skills.slice(0, -1));

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(inputValue);
      return;
    }
    if (event.key === "Backspace" && inputValue === "" && skills.length > 0) {
      removeLastSkill();
    }
  };

  const suggestedSkills = (allSkills ?? [])
    .map((skill) => skill.name)
    .filter((name) => !skills.includes(name));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 rounded-12 border border-neutral-200 bg-white p-2.5">
        {skills.map((skill) => (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12.5px] text-neutral-800"
            key={skill}
          >
            {skill}
            <button
              className="text-neutral-400 hover:text-neutral-700"
              type="button"
              onClick={() => setSkills(skills.filter((existing) => existing !== skill))}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 px-1.5 py-0.5 text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          placeholder={skills.length === 0 ? "Type a skill and press Enter…" : "Add another…"}
          value={inputValue}
          onBlur={() => {
            if (inputValue.trim()) addSkill(inputValue);
          }}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
      </div>
      {suggestedSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-neutral-400">Suggested:</span>
          {suggestedSkills.slice(0, MAX_SUGGESTIONS).map((skill) => (
            <button
              className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[11.5px] text-neutral-600 hover:border-brand-300 hover:text-brand-700"
              key={skill}
              type="button"
              onClick={() => addSkill(skill)}
            >
              <Plus className="mr-1 inline" size={9} />
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
