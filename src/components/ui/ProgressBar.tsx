/** Track line h8 r4, fill paper from the start side (right in RTL). */
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="flex h-2 w-full overflow-hidden rounded-sm bg-line"
    >
      <div className="h-full rounded-sm bg-paper transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}
