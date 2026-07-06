import { Asterisk, Briefcase, Code2, Share2, ShieldCheck, SlidersHorizontal, User } from "lucide-react";

export const TEXT_INPUT_CLASS =
  "rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export const SELECT_INPUT_CLASS =
  "rounded-10 focus:border-brand-500 w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100";

export const PROF_SECTIONS = [
  { id: "basics", label: "Basics", icon: User },
  { id: "about", label: "About you", icon: Asterisk },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "prefs", label: "Preferences", icon: SlidersHorizontal },
  { id: "links", label: "Links & CV", icon: Share2 },
  { id: "visibility", label: "Visibility", icon: ShieldCheck },
];
