import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyTalentProfile } from "@/features/talent/talent.queries";
import { ROUTES } from "@/constants/routes";

export const ProfileSnapshot = () => {
  const { user } = useAuth();
  const { data: profile } = useMyTalentProfile();

  return (
    <div className="mb-5 overflow-hidden rounded-16 border border-neutral-100 bg-white shadow-card">
      <div className="flex flex-col items-center p-5 text-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-semibold text-white">
          {(user?.name ?? "?").charAt(0).toUpperCase()}
        </div>
        <h3 className="text-[15px] font-semibold text-neutral-900">{user?.name}</h3>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          {profile?.headline || "No headline yet"}
        </p>
        <Link
          className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-8 border border-neutral-200 text-[12.5px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          to={ROUTES.profile}
        >
          Edit profile <ArrowRight size={12} />
        </Link>
      </div>
      <div className="border-t border-neutral-100">
        {[
          { icon: MapPin, label: "Based in", value: profile?.location || "—" },
          { icon: Clock, label: "Timezone", value: profile?.timezone || "—" },
          {
            icon: Briefcase,
            label: "Expecting",
            value:
              profile?.desiredSalaryMin && profile.desiredSalaryMax
                ? `$${profile.desiredSalaryMin.toLocaleString()}–${profile.desiredSalaryMax.toLocaleString()}/mo`
                : "—",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div className="flex items-center justify-between border-b border-neutral-50 px-4 py-2.5 last:border-none" key={label}>
            <span className="flex items-center gap-1.5 text-[12px] text-neutral-400">
              <Icon size={12} /> {label}
            </span>
            <span className="text-[12px] font-medium text-neutral-700">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
