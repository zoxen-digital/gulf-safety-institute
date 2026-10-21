// Single-series monthly bar chart: one hue, baseline-anchored bars, hover tooltip, table fallback.
export function MonthlyBars({ data, label }: { data: { month: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <figure className="p-5">
      <figcaption className="sr-only">{label}</figcaption>
      <p className="text-xs text-muted">Last 12 months · total {total}</p>
      <div className="mt-4 flex h-40 items-end gap-[2px] border-b border-slate-200" aria-hidden="true">
        {data.map((d) => (
          <div key={d.month} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-navy-dark px-2 py-1 text-[11px] text-white opacity-0 shadow transition group-hover:opacity-100">
              {d.month}: {d.value}
            </span>
            <div className="w-full rounded-t-[4px] bg-navy transition group-hover:bg-gold" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[10px] text-muted" aria-hidden="true">
        {data.map((d, i) => <span key={d.month} className="flex-1 text-center">{i % 2 === 0 ? d.month.slice(0, 3) : ""}</span>)}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th>Month</th><th>Count</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.month}><td>{d.month}</td><td>{d.value}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
