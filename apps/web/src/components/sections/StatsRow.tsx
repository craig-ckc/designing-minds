export function StatsRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface px-6 py-7">
          <strong className="block text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold tracking-[-0.03em]">
            {stat.value}
          </strong>
          <span className="text-[0.92rem] text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
