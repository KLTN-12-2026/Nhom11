import { Link } from "react-router-dom";
import { AlertTriangle, Eye, Lock, User } from "lucide-react";
import { ChangePasswordForm } from "@/features/settings/components/ChangePasswordForm";
import { DeleteAccountButton } from "@/features/settings/components/DeleteAccountButton";
import { AccountNameForm } from "@/features/settings/components/AccountNameForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

function SectionHead({
  eyebrow,
  title,
  help,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  help: string;
  icon: React.ElementType;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_220px]">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          <Icon size={12} /> {eyebrow}
        </p>
        <h2 className="text-[22px] font-semibold text-neutral-900">{title}</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-500">{help}</p>
    </div>
  );
}

export function SettingsPage() {
  useDocumentTitle("Settings");

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="mx-auto max-w-[820px] px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-1 text-[32px] font-semibold tracking-tight text-neutral-900">
            Your account,{" "}
            <em className="font-serif italic text-brand-700" style={{ fontFamily: "var(--font-serif)" }}>
              your rules.
            </em>
          </h1>
          <p className="text-[15px] text-neutral-500">
            Sign-in and security. Profile content lives under{" "}
            <Link className="text-brand-600 hover:text-brand-700" to={ROUTES.profile}>
              Profile setup
            </Link>
            .
          </p>
        </div>

        <div className="space-y-2">
          <section className="rounded-20 border border-neutral-100 bg-white p-7">
            <SectionHead
              eyebrow="Identity"
              help="The email you sign in with, and your display name."
              icon={User}
              title="Your account"
            />
            <AccountNameForm />
          </section>

          <section className="rounded-20 border border-neutral-100 bg-white p-7">
            <SectionHead eyebrow="Access" help="Keep your account secure." icon={Lock} title="Security" />
            <ChangePasswordForm />
          </section>

          <section className="rounded-20 border border-neutral-100 bg-white p-7">
            <SectionHead
              eyebrow="Visibility"
              help="Whether employers can find and contact you is managed from your talent profile."
              icon={Eye}
              title="Privacy"
            />
            <Link
              className="inline-flex items-center gap-1.5 rounded-10 border border-neutral-200 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-300"
              to={ROUTES.profile}
            >
              Manage in Profile setup
            </Link>
          </section>

          <section className="rounded-20 border border-red-100 bg-white p-7">
            <SectionHead
              eyebrow="Careful now"
              help="This is permanent and cannot be undone."
              icon={AlertTriangle}
              title="Danger zone"
            />
            <div className="flex items-center justify-between rounded-16 border border-red-200 bg-red-50/40 px-5 py-4">
              <div>
                <p className="text-[13.5px] font-semibold text-neutral-900">Delete account</p>
                <p className="text-[12.5px] text-neutral-500">
                  Permanently remove your profile and applications. This cannot be undone.
                </p>
              </div>
              <div className="ml-6 flex-shrink-0">
                <DeleteAccountButton />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
