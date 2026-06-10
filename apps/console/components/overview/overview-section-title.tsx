export function OverviewSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}
