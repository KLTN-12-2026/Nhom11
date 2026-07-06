import { Link } from "react-router-dom";

const FOOTER_COLS = [
  {
    heading: "Platform",
    links: [
      { label: "Jobs", href: "/jobs" },
      { label: "Salary guide", href: "/salary" },
      { label: "For employers", href: "/employer" },
      { label: "Newsletter", href: "/newsletter" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Remote work guide", href: "#" },
      { label: "CV templates", href: "#" },
      { label: "Interview prep", href: "#" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Founder story", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-neutral-100 bg-white">
      <div className="mx-auto max-w-[1240px] px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
              <span
                className="grid h-[26px] w-[26px] place-items-center rounded-[7px] pb-0.5 font-serif text-lg italic leading-none text-white"
                style={{ background: "linear-gradient(140deg, #2E9B52, #1F7A3D)" }}
              >
                R
              </span>
              RemoteSEA
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-neutral-500">
              Remote jobs from Singapore, Australia &amp; beyond — curated for Vietnam talent.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="font-medium uppercase tracking-widest">Made in</span>
              <span>Da Nang, Vietnam 🇻🇳</span>
            </div>
          </div>

          {/* Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h5 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                {col.heading}
              </h5>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                      to={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4 text-xs text-neutral-400">
          <span>© 2026 RemoteSEA · All rights reserved</span>
          <span>Built by a remote worker, for remote workers.</span>
        </div>
      </div>
    </footer>
  );
};
