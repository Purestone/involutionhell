export function AnimatedBar({
  value,
  max,
  heightClass = "h-6",
}: {
  value: number;
  max: number;
  heightClass?: string;
}) {
  return (
    <div
      className={`w-full ${heightClass} border border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative`}
    >
      <div
        className="absolute top-0 left-0 h-full bg-[var(--foreground)] origin-left"
        style={{ width: `${(value / max) * 100}%` }}
      />
      <div className="absolute inset-0 flex items-center px-2 font-mono text-[10px] text-[var(--background)] mix-blend-difference whitespace-nowrap pointer-events-none">
        POWER LEVEL
      </div>
    </div>
  );
}
