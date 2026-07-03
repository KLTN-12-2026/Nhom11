import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

const PREVIEW_JOBS = [
  {
    title: "Senior Frontend Engin…",
    company: "Canva · AU",
    salary: "$4,500–7,000/mo",
    color: "#00C4CC",
    initial: "C",
  },
  {
    title: "Design Engineer",
    company: "Linear · US",
    salary: "$5,500–8,000/mo",
    color: "#5E6AD2",
    initial: "L",
  },
];

export function LoginPage() {
  useDocumentTitle("Sign In");

  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-2">
      {/* Left panel */}
      <div
        className="hidden flex-col justify-between p-12 text-white lg:flex"
        style={{ background: "linear-gradient(160deg, #0D3D1F 0%, #1F7A3D 100%)" }}
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-white/10 pb-0.5 font-serif text-xl italic leading-none">
            R
          </span>
          RemoteSEA
        </div>

        <div>
          <p
            className="mb-1 text-[26px] font-light italic text-white/60"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Welcome back.
          </p>
          <h2 className="mb-4 text-[40px] font-semibold leading-tight">
            Pick up where
            <br />
            you left off.
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            New jobs went live this week. Two match your saved filters.
          </p>

          <div className="mb-6 grid grid-cols-3 gap-4 rounded-16 border border-white/10 bg-white/5 p-5">
            {[
              { v: "12", l: "Jobs added\nthis week" },
              { v: "2", l: "Match your\nfilters" },
              { v: "$3.2k", l: "Median\nsalary" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-[22px] font-semibold">{s.v}</div>
                <div className="mt-0.5 whitespace-pre-line text-[11px] leading-tight text-white/50">
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {PREVIEW_JOBS.map((j) => (
              <div
                className="flex items-center gap-3 rounded-12 border border-white/10 bg-white/5 p-3"
                key={j.title}
              >
                <div
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-8 text-xs font-semibold text-white"
                  style={{ background: j.color }}
                >
                  {j.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{j.title}</div>
                  <div className="text-[12px] text-white/50">{j.company}</div>
                </div>
                <span className="whitespace-nowrap rounded-8 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                  {j.salary}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">© 2026 RemoteSEA · Made in Đà Nẵng, Vietnam 🇻🇳</p>
      </div>

      {/* Right panel (form) */}
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-8 py-12">
        <div className="mb-10 flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            to={ROUTES.home}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <p className="text-sm text-neutral-500">
            New here?{" "}
            <Link
              className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-700"
              to={ROUTES.register}
            >
              Create account <ArrowRight size={13} />
            </Link>
          </p>
        </div>

        <h1 className="mb-1 text-[36px] font-semibold tracking-tight text-neutral-900">
          Sign in to RemoteSEA.
        </h1>
        <p className="mb-8 text-sm text-neutral-500">Continue your search where you left off.</p>

        <LoginForm />
      </div>
    </div>
  );
}
