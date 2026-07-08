export function StatsRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card px-6 py-7">
          <strong className="block text-[clamp(2rem,3.4vw,2.8rem)] font-extrabold tracking-[-0.03em] text-primary">
            {stat.value}
          </strong>
          <span className="text-[0.95rem] font-medium text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
