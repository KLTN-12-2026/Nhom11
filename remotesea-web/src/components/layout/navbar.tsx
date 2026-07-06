import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bookmark } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/salary", label: "Salary" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dashboardHref = user?.role === "EMPLOYER" ? ROUTES.employerDashboard : ROUTES.talent;

  const handleSignOut = () => {
    logout();
    navigate(ROUTES.home);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100 bg-neutral-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-6">
        {/* Brand */}
        <Link
          className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-neutral-900"
          to={ROUTES.home}
        >
          <span
            className="grid h-[26px] w-[26px] place-items-center rounded-[7px] pb-0.5 font-serif text-lg italic leading-none text-white"
            style={{
              background: "linear-gradient(140deg, #2E9B52, #1F7A3D)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            R
          </span>
          <span>RemoteSEA</span>
          <span className="ml-0.5 border-l border-neutral-200 pl-2.5 text-[11px] font-normal text-neutral-400">
            Jobs · SEA
          </span>
        </Link>

        {/* Nav links */}
        <nav className="ml-4 flex gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              className={cn(
                "rounded-8 px-3 py-1.5 text-sm transition-colors",
                location.pathname.startsWith(href)
                  ? "font-medium text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
              key={href}
              to={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            className="rounded-8 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            to={ROUTES.employer}
          >
            For employers
          </Link>

          <button
            aria-label="Saved jobs"
            className="grid h-9 w-9 place-items-center rounded-8 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Bookmark size={17} />
          </button>

          {user ? (
            <>
              <Link
                className="rounded-8 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                to={dashboardHref}
              >
                Dashboard
              </Link>
              <button
                className="rounded-8 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                type="button"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                className="rounded-8 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                to={ROUTES.login}
              >
                Sign in
              </Link>

              <Link
                className="inline-flex h-[38px] items-center gap-1.5 rounded-8 bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                to={ROUTES.register}
              >
                <Bell size={14} />
                Get job alerts
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
