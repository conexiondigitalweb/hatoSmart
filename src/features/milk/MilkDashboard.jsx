import { useLiveQuery } from 'dexie-react-hooks'
import { format, subDays } from 'date-fns'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 flex flex-col gap-0.5">
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{payload[0].value}L</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  )
}

export default function MilkDashboard() {
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const today = format(new Date(), 'yyyy-MM-dd')
  const ago14 = format(subDays(new Date(), 14), 'yyyy-MM-dd')
  const ago7  = format(subDays(new Date(), 7),  'yyyy-MM-dd')

  const records = useLiveQuery(
    () => activeFarm
      ? db.milk_records.where('farm_id').equals(activeFarm.id)
          .filter((r) => !r.deleted_at && r.date >= ago14).toArray()
      : [],
    [activeFarm?.id]
  )

  if (!records?.length) return null

  const byDate = records.reduce((acc, r) => {
    acc[r.date] = (acc[r.date] ?? 0) + (r.liters_produced ?? 0)
    return acc
  }, {})

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
    return { date: d, label: format(new Date(d + 'T00:00'), 'dd/MM'), liters: byDate[d] ?? 0 }
  })

  const todayTotal   = byDate[today] ?? 0
  const last7Vals    = Object.entries(byDate).filter(([d]) => d >= ago7).map(([, v]) => v)
  const avg7         = last7Vals.length ? (last7Vals.reduce((a, b) => a + b, 0) / last7Vals.length).toFixed(1) : 0
  const yesterday    = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const yesterdayVal = byDate[yesterday] ?? 0
  const trend        = yesterdayVal > 0 ? (((todayTotal - yesterdayVal) / yesterdayVal) * 100).toFixed(0) : null
  const todayRecord  = records.find((r) => r.date === today && r.cows_milked)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Litros hoy"
          value={todayTotal > 0 ? `${todayTotal}L` : '—'}
          sub={trend !== null ? `${Number(trend) >= 0 ? '+' : ''}${trend}% vs ayer` : undefined}
        />
        <MetricCard label="Promedio 7 días" value={avg7 > 0 ? `${avg7}L` : '—'} />
        {todayRecord?.cows_milked && (
          <MetricCard
            label="Vacas ordeñadas"
            value={todayRecord.cows_milked}
            sub={todayTotal && todayRecord.cows_milked
              ? `${(todayTotal / todayRecord.cows_milked).toFixed(1)}L/vaca`
              : undefined}
          />
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Producción 14 días</p>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={1} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="liters"
              stroke="#16a34a" strokeWidth={2} fill="url(#milkGrad)"
              dot={(props) => props.payload.date === today
                ? <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="#16a34a" stroke="#fff" strokeWidth={2} />
                : <g key={props.key} />
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
