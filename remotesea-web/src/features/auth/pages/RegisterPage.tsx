import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

export const RegisterPage = () => {
  useDocumentTitle("Create Account");

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
          <h2 className="mb-4 text-[40px] font-semibold leading-tight">
            <span
              className="text-brand-400"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              500+ talent
            </span>{" "}
            already on board.
            <br />
            Quietly, sustainably
            <br />
            finding remote work.
          </h2>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-white/60">
            No spam. No recruiters in your inbox. Just curated jobs you can actually trust.
          </p>
          <div className="rounded-16 border border-white/10 bg-white/5 p-5">
            <p className="mb-4 text-sm italic leading-relaxed text-white/80">
              &ldquo;Mình apply được vào đúng công ty Singapore phù hợp timezone và được offer
              $2,800/month sau 3 tuần.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-semibold">
                PT
              </div>
              <div>
                <div className="text-sm font-medium">Phạm Tuấn</div>
                <div className="text-[12px] text-white/40">Frontend Developer · Hired 3 weeks</div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/30">© 2026 RemoteSEA · Free for talent. Forever.</p>
      </div>

      {/* Right panel */}
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-8 py-12">
        <div className="mb-10 flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            to={ROUTES.home}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <p className="text-sm text-neutral-500">
            Already a member?{" "}
            <Link
              className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-700"
              to={ROUTES.login}
            >
              Sign in <ArrowRight size={13} />
            </Link>
          </p>
        </div>

        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
            1
          </span>
          <span className="text-sm text-neutral-400">of 2</span>
          <div className="mx-2 h-1.5 flex-1 rounded-full bg-neutral-100">
            <div className="h-full w-1/2 rounded-full bg-brand-600" />
          </div>
          <span className="text-[12px] text-neutral-400">Your account</span>
        </div>

        <h1 className="mb-1 text-[36px] font-semibold tracking-tight text-neutral-900">
          Join RemoteSEA.
        </h1>
        <p className="mb-8 text-sm text-neutral-500">Free for talent. Forever. No card needed.</p>

        <RegisterForm />
      </div>
    </div>
  );
};
