interface EmptyRowProps {
  children: React.ReactNode;
}

export const EmptyRow = ({ children }: EmptyRowProps) => (
  <p className="py-8 text-center text-[13px] text-neutral-400">{children}</p>
);
