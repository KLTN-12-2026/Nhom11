const DEFAULT_COMPANY_INITIAL_COLOR = "#9B9690";
const FONT_SIZE_RATIO = 0.38;

interface CompanyInitialProps {
  name: string;
  color?: string;
  size?: number;
}

export const CompanyInitial = ({ name, color = DEFAULT_COMPANY_INITIAL_COLOR, size = 38 }: CompanyInitialProps) => (
  <div
    aria-label={name}
    className="rounded-10 grid flex-shrink-0 place-items-center font-semibold text-white"
    style={{ background: color, width: size, height: size, fontSize: size * FONT_SIZE_RATIO }}
  >
    {name[0]?.toUpperCase()}
  </div>
);
