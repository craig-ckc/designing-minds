import { Card } from '../ui/card'

export function StatsRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} pad="none" className="px-6 py-7">
          <strong className="block text-display font-extrabold tracking-[-0.03em] text-primary">
            {stat.value}
          </strong>
          <span className="text-body font-medium text-muted">{stat.label}</span>
        </Card>
      ))}
    </div>
  )
}
