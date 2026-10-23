import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSalaryBenchmarks } from "@/features/salary/salary.queries";
import { BenchBar } from "@/components/home/BenchBar";
import { ROUTES } from "@/constants/routes";

const MIN_GLOBAL_MAX = 1;

export const SalaryBenchmark = () => {
  const { data: benches } = useSalaryBenchmarks();
  if (!benches || benches.length === 0) return null;

  const totalPoints = benches.reduce((a, b) => a + b.count, 0);
  const globalMax = Math.max(...benches.map((b) => b.max), MIN_GLOBAL_MAX);

  return (
    <section className="py-20" style={{ background: "#1A1917" }}>
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
              Salary data
            </p>
            <h2
              className="mb-4 font-serif text-[36px] leading-tight tracking-tight text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Know your worth <em className="italic text-brand-400">before</em> you negotiate.
            </h2>
            <p className="mb-10 max-w-lg text-[15px] leading-relaxed text-neutral-400">
              Live salary data aggregated from active listings on RemoteSEA. Updated as new roles go
              live.
            </p>

            <div className="space-y-5">
              {benches.map((b) => (
                <div key={b.role}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-200">{b.role}</span>
                    <span className="font-mono text-[13px] text-neutral-400">
                      ${b.min.toLocaleString()}–${b.max.toLocaleString()}/mo
                    </span>
                  </div>
                  <BenchBar globalMax={globalMax} max={b.max} mid={b.mid} min={b.min} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="rounded-24 border border-white/10 bg-white/5 p-7">
              <h4 className="mb-3 text-[17px] font-semibold text-white">
                Based on {totalPoints.toLocaleString()} active{" "}
                {totalPoints === 1 ? "listing" : "listings"} across {benches.length}{" "}
                {benches.length === 1 ? "field" : "fields"}.
              </h4>
              <p className="mb-6 text-[14px] leading-relaxed text-neutral-400">
                Aggregated from live, verified job listings on RemoteSEA — real salary ranges
                employers are offering right now.
              </p>
              <Link
                className="inline-flex items-center gap-2 rounded-12 border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-600 hover:text-white"
                to={ROUTES.salary}
              >
                See full salary guide <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
