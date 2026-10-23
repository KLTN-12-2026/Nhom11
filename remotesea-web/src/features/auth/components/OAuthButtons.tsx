import { oauthUrl } from "@/features/auth/auth.api";

const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google", bg: "#4285F4", icon: "G" },
  { id: "github", label: "Continue with GitHub", bg: "#24292F", icon: "GH" },
] as const;

export const OAuthButtons = () => {
  return (
    <div className="mb-6 space-y-3">
      {OAUTH_PROVIDERS.map((provider) => (
        <a
          className="flex h-11 w-full items-center gap-3 rounded-12 border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50"
          href={oauthUrl(provider.id)}
          key={provider.id}
        >
          <span
            className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-4 text-[11px] font-bold text-white"
            style={{ background: provider.bg }}
          >
            {provider.icon}
          </span>
          {provider.label}
        </a>
      ))}
    </div>
  );
};
