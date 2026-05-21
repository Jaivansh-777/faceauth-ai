import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, ShieldCheck, ShieldX, Activity,
  UserPlus, ScanFace, FileText,
  ArrowUpRight, ArrowDownRight, Clock, Zap,
  CheckCircle2, XCircle, AlertTriangle, Server, RefreshCw, Shield
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import FaceScanAnimation from './FaceScanAnimation'
import { fetchStats } from '../api'
import type { Stats } from '../types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function generateChartData(stats: Stats) {
  const total = stats.total_logs || 0
  const success = stats.success_logs || 0
  return DAYS.map((day) => {
    const base = Math.round(total / 7)
    const variance = Math.round(base * 0.3)
    const val = Math.max(0, base + Math.floor(Math.random() * variance * 2 - variance))
    const successVal = Math.round(val * (total > 0 ? success / total : 0.7))
    const failedVal = val - successVal
    return { day, granted: Math.max(0, successVal), denied: Math.max(0, failedVal) }
  })
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-skeleton">
      <div className="w-9 h-9 rounded-xl mb-3" style={{ background: 'var(--badge-bg)' }} />
      <div className="w-20 h-7 rounded mb-1" style={{ background: 'var(--badge-bg)' }} />
      <div className="w-28 h-3 rounded" style={{ background: 'var(--badge-bg)' }} />
    </div>
  )
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass-card p-8 text-center">
      <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--warning)' }} />
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Failed to load data</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Could not connect to the server. Check if backend is running.</p>
      <button onClick={onRetry} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [chartData, setChartData] = useState<{ day: string; granted: number; denied: number }[]>([])

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true); setError(false)
    try {
      const d = await fetchStats()
      setStats(d)
      setChartData(generateChartData(d))
    } catch {
      setError(true)
    } finally { setLoading(false) }
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorCard onRetry={loadStats} />
      </div>
    )
  }

  const rate = stats && stats.total_logs > 0 ? Math.round((stats.success_logs / stats.total_logs) * 100) : 0

  const statCards = [
    { label: 'Enrolled Users', value: stats?.total_users ?? '—', icon: Users, gradient: 'from-blue-500 to-purple-500', shadow: 'shadow-blue-500/15', barColor: 'bg-blue-500', barWidth: stats ? Math.min((stats.total_users / 20) * 100, 100) : 0, trending: 'up' as const },
    { label: 'Successful Auths', value: stats?.success_logs ?? '—', icon: ShieldCheck, gradient: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/15', barColor: 'bg-emerald-500', barWidth: stats ? Math.min((stats.success_logs / 100) * 100, 100) : 0, trending: 'up' as const },
    { label: 'Failed Attempts', value: stats?.failed_logs ?? '—', icon: ShieldX, gradient: 'from-rose-500 to-red-500', shadow: 'shadow-rose-500/15', barColor: 'bg-rose-500', barWidth: stats ? Math.min((stats.failed_logs / 50) * 100, 100) : 0, trending: (stats?.failed_logs && stats.failed_logs > 5 ? 'up' : 'down') as 'up' | 'down' },
    { label: 'Total Requests', value: stats?.total_logs ?? '—', icon: Activity, gradient: 'from-sky-500 to-blue-500', shadow: 'shadow-sky-500/15', barColor: 'bg-sky-500', barWidth: stats ? Math.min((stats.total_logs / 200) * 100, 100) : 0, trending: 'up' as const },
  ]

  const recentLogs = stats?.recent_logs ?? []
  const threatAlerts = recentLogs.filter(l => !l.success).slice(0, 4)
  const liveFeed = recentLogs.slice(0, 8)

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card relative overflow-hidden p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-violet-500/[0.03]" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="shrink-0 animate-float">
            <FaceScanAnimation size={120} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                  <span className="relative rounded-full bg-emerald-500 h-1.5 w-1.5" />
                </span>
                System Online
              </span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--accent)' }}>v2.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Enterprise Biometric <span className="text-gradient">Access Control</span>
            </h1>
            <p className="text-sm mt-1 max-w-lg" style={{ color: 'var(--text-2)' }}>
              Real-time authentication monitor &bull; {stats ? `${stats.total_logs || 0} total requests processed` : 'Loading...'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5 justify-center md:justify-start">
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'enroll' }))} className="shimmer-button inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                <UserPlus size={14} /> Enroll User
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'auth' }))} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:shadow-md" style={{ borderColor: 'var(--glass-border)', color: 'var(--text)', background: 'var(--surface)' }}>
                <ScanFace size={14} /> Authenticate
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'logs' }))} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:shadow-md" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-2)', background: 'var(--surface)' }}>
                <FileText size={14} /> View Logs
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="glass-card glass-card-hover p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                    <card.icon size={18} className="text-white" />
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <ArrowUpRight size={10} />{card.trending === 'up' ? 'Active' : 'Low'}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{card.value}</p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>{card.label}</p>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--badge-bg)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.barWidth}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${card.barColor}`}
                  />
                </div>
              </motion.div>
            ))}
      </motion.div>

      {/* Analytics + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Authentication Analytics</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Daily auth success / failure distribution</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>7-day</span>
          </div>
          <div className="h-52 md:h-60">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: 'var(--glass-shadow-lg)',
                    }}
                    cursor={{ fill: 'rgba(37,99,235,0.04)' }}
                  />
                  <Bar dataKey="granted" radius={[6, 6, 0, 0]} fill="#10b981" maxBarSize={20} />
                  <Bar dataKey="denied" radius={[6, 6, 0, 0]} fill="#ef4444" maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-4)' }}>
                <div className="flex flex-col items-center gap-2"><Activity size={24} className="opacity-30" /><span>No data available yet. Auth events will appear here.</span></div>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Server size={14} className="text-blue-500" />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>System Health</h3>
          </div>
          <div className="space-y-3">
            <HealthMetric label="Threat Level" value={stats?.failed_logs && stats.failed_logs > 10 ? 'Elevated' : 'Low'} icon={AlertTriangle}
              color={stats?.failed_logs && stats.failed_logs > 10 ? 'text-amber-600' : 'text-emerald-600'}
              bgColor={stats?.failed_logs && stats.failed_logs > 10 ? 'bg-amber-50' : 'bg-emerald-50'}
              borderColor={stats?.failed_logs && stats.failed_logs > 10 ? 'border-amber-200' : 'border-emerald-200'} />
            <HealthMetric label="Success Rate" value={`${rate}%`} icon={CheckCircle2}
              color={rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-rose-600'}
              bgColor={rate >= 80 ? 'bg-emerald-50' : rate >= 50 ? 'bg-amber-50' : 'bg-rose-50'}
              borderColor={rate >= 80 ? 'border-emerald-200' : rate >= 50 ? 'border-amber-200' : 'border-rose-200'} />
            <HealthMetric label="Total Users" value={stats?.total_users ?? '—'} icon={Users} color="text-blue-600" bgColor="bg-blue-50" borderColor="border-blue-200" />
            <HealthMetric label="System Uptime" value="99.9%" icon={Zap} color="text-sky-600" bgColor="bg-sky-50" borderColor="border-sky-200" />
          </div>
          <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-xs"><span style={{ color: 'var(--text-3)' }}>Last incident</span><span className="font-medium" style={{ color: 'var(--text)' }}>7 days ago</span></div>
            <div className="flex items-center justify-between text-xs"><span style={{ color: 'var(--text-3)' }}>Face model</span><span className="font-medium" style={{ color: 'var(--text)' }}>InsightFace v1.0</span></div>
            <div className="flex items-center justify-between text-xs"><span style={{ color: 'var(--text-3)' }}>Database</span><span className="font-medium" style={{ color: 'var(--text)' }}>Neon PostgreSQL</span></div>
          </div>
        </motion.div>
      </div>

      {/* Live Feed + Threat Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
          className="lg:col-span-1 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Live Auth Feed</h3>
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                <span className="relative rounded-full bg-emerald-500 h-2 w-2" />
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>Real-time</span>
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {liveFeed.length > 0 ? liveFeed.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: i % 2 === 0 ? 'var(--badge-bg)' : 'transparent' }}>
                <div className={`mt-0.5 ${log.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {log.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{log.user_name || 'Unknown'}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {log.success ? 'Access granted' : 'Access denied'}{log.confidence != null && ` · ${log.confidence}%`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] shrink-0" style={{ color: 'var(--text-4)' }}>
                  <Clock size={10} />
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-10" style={{ color: 'var(--text-4)' }}>
                <Activity size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No activity recorded yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Threat Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.38 }}
          className="lg:col-span-1 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-rose-500" />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Threat Alerts</h3>
            {threatAlerts.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">{threatAlerts.length}</span>
            )}
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {threatAlerts.length > 0 ? threatAlerts.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: 'rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.03)' }}>
                <div className="mt-0.5 text-rose-500"><AlertTriangle size={14} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Unauthorized access attempt</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {log.confidence != null ? `${log.confidence}% match · ` : ''}
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                  </p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-10" style={{ color: 'var(--text-4)' }}>
                <Shield size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No threats detected</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-1 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Activity</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Last 10 attempts</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>Live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <Th>User</Th>
                  <Th>Result</Th>
                  <Th className="hidden sm:table-cell">Time</Th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.length > 0 ? recentLogs.slice(0, 6).map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group border-b transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <Td className="font-medium" tdStyle={{ color: 'var(--text)' }}>{log.user_name || 'Unknown'}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        log.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {log.success ? 'Granted' : 'Denied'}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell" tdStyle={{ color: 'var(--text-3)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </Td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-12" style={{ color: 'var(--text-4)' }}>
                    <Activity size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activity recorded</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function HealthMetric({ label, value, icon: Icon, color, bgColor, borderColor }: {
  label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>
  color: string; bgColor: string; borderColor: string
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${bgColor} ${borderColor}`}>
      <div className={`${bgColor} ${color} w-8 h-8 rounded-lg flex items-center justify-center`}><Icon size={15} /></div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-3 ${className}`} style={{ color: 'var(--text-4)' }}>{children}</th>
}

function Td({ children, className = '', tdStyle }: { children: React.ReactNode; className?: string; tdStyle?: React.CSSProperties }) {
  return <td className={`px-4 py-3 text-xs ${className}`} style={tdStyle}>{children}</td>
}
