import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Filter, Clock, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { fetchLogs } from '../api'
import type { AuthLog } from '../types'

export default function ActivityLog() {
  const [logs, setLogs] = useState<AuthLog[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    setLoading(true)
    try { const d = await fetchLogs(filter || undefined); setLogs(d) } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadLogs() }, [filter])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Authentication Logs</h3>
            {!loading && <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>{logs.length} entries</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border rounded-xl focus:outline-none focus:border-indigo-400/50 appearance-none cursor-pointer"
                style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                <option value="">All</option>
                <option value="true">Granted</option>
                <option value="false">Denied</option>
              </select>
            </div>
            <button onClick={loadLogs} className="p-1.5 rounded-lg border transition-all hover:shadow-sm" style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm responsive-table">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <Th>User</Th>
                <Th>Confidence</Th>
                <Th>Result</Th>
                <Th className="hidden sm:table-cell">Camera</Th>
                <Th>Time</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-5 py-4"><div className="h-4 rounded animate-skeleton" style={{ background: 'var(--badge-bg)', width: j === 1 ? '60px' : '80px' }} /></td>
                ))}</tr>
              )) : logs.length > 0 ? logs.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="group border-b transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <Td data-label="User" className="font-medium" tdStyle={{ color: 'var(--text)' }}>{log.user_name || '—'}</Td>
                  <Td data-label="Confidence"><span className="font-mono" style={{ color: 'var(--text)' }}>{log.confidence != null ? `${log.confidence}%` : '—'}</span></Td>
                  <Td data-label="Result">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${log.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {log.success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{log.success ? 'Granted' : 'Denied'}
                    </span>
                  </Td>
                  <Td data-label="Camera" className="hidden sm:table-cell"><span style={{ color: 'var(--text-3)' }}>{log.camera_id || '—'}</span></Td>
                  <Td data-label="Time"><span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}><Clock size={11} />{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</span></Td>
                </motion.tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-16" style={{ color: 'var(--text-4)' }}>
                  <div className="flex flex-col items-center gap-3"><Activity size={32} className="opacity-30" /><p className="text-sm" style={{ color: 'var(--text-3)' }}>No logs found</p><p className="text-xs">{filter ? 'Try changing the filter' : 'Authentication events will appear here'}</p></div>
                </td></tr>
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
