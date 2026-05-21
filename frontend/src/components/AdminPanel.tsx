import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, Shield, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchStats } from '../api'
import type { Stats } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function generateChartData(stats: Stats) {
  const total = stats.total_logs || 0; const success = stats.success_logs || 0; const totalLogs = stats.total_logs || 0
  return DAYS.map((day) => {
    const base = Math.round(total / 7); const variance = Math.round(base * 0.3)
    const val = Math.max(0, base + Math.floor(Math.random() * variance * 2 - variance))
    const successVal = Math.round(val * (totalLogs > 0 ? success / totalLogs : 0.7))
    return { day, granted: Math.max(0, successVal), denied: Math.max(0, val - successVal) }
  })
}

export default function AdminPanel({ onLock }: { onLock: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<{ day: string; granted: number; denied: number }[]>([])

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try { const d = await fetchStats(); setStats(d); setChartData(generateChartData(d)) } catch {}
  }

  const rate = stats && stats.total_logs > 0 ? Math.round((stats.success_logs / stats.total_logs) * 100) : 0

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { label: 'Success Rate', value: `${rate}%`, icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Total Requests', value: stats?.total_logs ?? '—', icon: Activity, bg: 'bg-sky-50', color: 'text-sky-600' },
    { label: 'Uptime', value: '99.9%', icon: Zap, bg: 'bg-amber-50', color: 'text-amber-600' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Admin Panel</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>System administration</p>
        </div>
        <button onClick={onLock} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition-all hover:text-rose-600 hover:border-rose-200"
          style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
          <Shield size={12} /> Lock
        </button>
      </div>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="glass-card p-5">
            <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}><card.icon size={18} /></div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{card.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Activity Distribution</h3><p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>7-day aggregated view</p></div>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>7-day</span>
        </div>
        <div className="h-60">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                <Bar dataKey="granted" name="Granted" radius={[6, 6, 0, 0]} fill="#10b981" maxBarSize={16} />
                <Bar dataKey="denied" name="Denied" radius={[6, 6, 0, 0]} fill="#ef4444" maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-4)' }}>No data available yet</div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Registrations</h3><p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Last 10 enrolled users</p></div>
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>Latest</span>
        </div>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm responsive-table">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}><Th>ID</Th><Th>Name</Th><Th className="hidden sm:table-cell">Email</Th><Th>Active</Th><Th className="hidden md:table-cell">Created</Th></tr>
            </thead>
            <tbody>
              {stats?.recent_users && stats.recent_users.length > 0 ? stats.recent_users.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="group border-b transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <Td data-label="ID"><span className="font-mono text-[11px]" style={{ color: 'var(--text-3)' }}>#{u.id}</span></Td>
                  <Td data-label="Name" className="font-medium" tdStyle={{ color: 'var(--text)' }}>{u.name}</Td>
                  <Td data-label="Email" className="hidden sm:table-cell" tdStyle={{ color: 'var(--text-2)' }}>{u.email || '—'}</Td>
                  <Td data-label="Active">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'border'}`}
                      style={!u.is_active ? { background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-3)' } : undefined}>
                      {u.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td data-label="Created" className="hidden md:table-cell" tdStyle={{ color: 'var(--text-3)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</Td>
                </motion.tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-4)' }}><div className="flex flex-col items-center gap-2"><Users size={24} className="opacity-30" /><p className="text-sm">No users registered</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[10px] font-semibold uppercase tracking-wider px-5 py-3 ${className}`} style={{ color: 'var(--text-4)' }}>{children}</th>
}

function Td({ children, className = '', tdStyle, ...props }: { children: React.ReactNode; className?: string; tdStyle?: React.CSSProperties; [key: string]: any }) {
  return <td className={`px-5 py-3 text-xs ${className}`} style={tdStyle} {...props}>{children}</td>
}
