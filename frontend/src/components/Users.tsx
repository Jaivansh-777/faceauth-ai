import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Trash2, Mail, CheckCircle, XCircle, Users as UsersIcon } from 'lucide-react'
import { useToast } from './Toast'
import { fetchUsers, deleteUser } from '../api'
import type { User } from '../types'

export default function Users() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try { const d = await fetchUsers(); setUsers(d) } catch {} finally { setLoading(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm(`Delete user ${id}?`)) return
    try { await deleteUser(id); toast('User deleted'); loadUsers() }
    catch (e: any) { toast(e.message || 'Delete failed', 'error') }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Enrolled Users</h3>
            {!loading && <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)' }}>{users.length} total</span>}
          </div>
          <button onClick={loadUsers} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition-all hover:shadow-sm"
            style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <Th>ID</Th><Th>Name</Th><Th className="hidden md:table-cell">Email</Th><Th className="hidden sm:table-cell">Role</Th><Th>Active</Th><Th className="hidden sm:table-cell">Embeddings</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-4"><div className="h-4 rounded animate-skeleton" style={{ background: 'var(--badge-bg)', width: j === 0 ? '40px' : j === 6 ? '24px' : '80px' }} /></td>
                ))}</tr>
              )) : users.length > 0 ? users.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="group border-b transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <Td><span className="font-mono text-[11px]" style={{ color: 'var(--text-3)' }}>#{user.id}</span></Td>
                  <Td className="font-medium" tdStyle={{ color: 'var(--text)' }}>{user.name}</Td>
                  <Td className="hidden md:table-cell"><span className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}><Mail size={11} />{user.email || '—'}</span></Td>
                  <Td className="hidden sm:table-cell"><span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{user.role || 'user'}</span></Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'border'}`}
                      style={!user.is_active ? { background: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--text-3)' } : undefined}>
                      {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}{user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell"><span style={{ color: 'var(--text-3)' }}>{user.embedding_count ?? '—'}</span></Td>
                  <Td>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50" style={{ color: 'var(--text-4)' }}>
                      <Trash2 size={13} />
                    </button>
                  </Td>
                </motion.tr>
              )) : (
                <tr><td colSpan={7} className="text-center py-16" style={{ color: 'var(--text-4)' }}>
                  <div className="flex flex-col items-center gap-3"><UsersIcon size={32} className="opacity-30" /><p className="text-sm" style={{ color: 'var(--text-3)' }}>No users enrolled</p><p className="text-xs">Enroll users from the Enroll page</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-skeleton">
              <div className="w-24 h-4 rounded mb-2" style={{ background: 'var(--badge-bg)' }} />
              <div className="w-32 h-3 rounded" style={{ background: 'var(--badge-bg)' }} />
            </div>
          )) : users.length > 0 ? users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{user.email || 'No email'} · #{user.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-50 text-zinc-500'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50" style={{ color: 'var(--text-4)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-12" style={{ color: 'var(--text-4)' }}>
              <UsersIcon size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No users enrolled</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[10px] font-semibold uppercase tracking-wider px-5 py-3 ${className}`} style={{ color: 'var(--text-4)' }}>{children}</th>
}

function Td({ children, className = '', tdStyle }: { children: React.ReactNode; className?: string; tdStyle?: React.CSSProperties }) {
  return <td className={`px-5 py-3 text-xs ${className}`} style={tdStyle}>{children}</td>
}
