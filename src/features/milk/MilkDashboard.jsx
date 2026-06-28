import { useLiveQuery } from 'dexie-react-hooks'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'

export default function MilkDashboard() {
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const today = format(new Date(), 'yyyy-MM-dd')
  const ago14 = format(subDays(new Date(), 14), 'yyyy-MM-dd')

  const records = useLiveQuery(
    () => activeFarm
      ? db.milk_records
          .where('farm_id').equals(activeFarm.id)
          .filter((r) => !r.deleted_at && r.date >= ago14)
          .toArray()
      : [],
    [activeFarm?.id]
  )

  if (!records?.length) return null

  // Aggregate by date (sum AM+PM or use total)
  const byDate = records.reduce((acc, r) => {
    acc[r.date] = (acc[r.date] ?? 0) + (r.liters_produced ?? 0)
    return acc
  }, {})

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
    return { date: d, label: format(new Date(d + 'T00:00'), 'dd/MM'), liters: byDate[d] ?? 0 }
  })

  const todayTotal = byDate[today] ?? 0
  const last7 = Object.entries(byDate)
    .filter(([d]) => d >= format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .map(([, v]) => v)
  const avg7 = last7.length ? (last7.reduce((a, b) => a + b, 0) / last7.length).toFixed(1) : 0

  const todayRecord = records.find((r) => r.date === today && (r.session === 'total' || r.cows_milked))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <span className="text-2xl">🥛</span>
          <p className="text-2xl font-bold text-[#2b3240] mt-1">{todayTotal > 0 ? `${todayTotal}L` : '—'}</p>
          <p className="text-xs text-gray-500">Litros hoy</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <span className="text-2xl">📊</span>
          <p className="text-2xl font-bold text-[#2b3240] mt-1">{avg7 > 0 ? `${avg7}L` : '—'}</p>
          <p className="text-xs text-gray-500">Promedio 7 días</p>
        </div>
        {todayRecord?.cows_milked && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <span className="text-2xl">🐄</span>
            <p className="text-2xl font-bold text-[#2b3240] mt-1">{todayRecord.cows_milked}</p>
            <p className="text-xs text-gray-500">Vacas ordeñadas</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Producción 14 días</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={1} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }}
              formatter={(v) => [`${v}L`, 'Litros']}
            />
            <Bar dataKey="liters" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.date} fill={entry.date === today ? '#3dbf5e' : '#d1fae5'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
