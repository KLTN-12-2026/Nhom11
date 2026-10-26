const COMPANIES = ["Finch Labs", "Brackish", "Meridian", "Northwind", "Cedar Co", "Altimeter", "Sky Mavis", "Carousell"];

export const LogoStrip = () => (
  <div className="border-y border-neutral-100 bg-neutral-50 py-8">
    <div className="mx-auto max-w-[1240px] px-6">
      <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Trusted by hiring teams at</p>
      <div className="flex flex-wrap justify-center gap-x-14 gap-y-3">
        {COMPANIES.map((name) => (
          <span className="cursor-default font-serif text-[22px] italic tracking-tight text-neutral-300 transition-colors hover:text-neutral-700" key={name} style={{ fontFamily: "var(--font-serif)" }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  </div>
);
