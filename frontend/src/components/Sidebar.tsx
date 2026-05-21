// @ts-nocheck
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UserPlus, ScanFace,
  Activity, Users, X, ChevronDown
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  isOpen: boolean
  onToggle: () => void
  logCount: number
  userCount: number
}

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'enroll', label: 'Enroll', icon: UserPlus },
  { id: 'auth', label: 'Authenticate', icon: ScanFace },
]

const mgmtNav = [
  { id: 'logs', label: 'Activity Log', icon: Activity, badge: 'logCount' as const },
  { id: 'users', label: 'Users', icon: Users, badge: 'userCount' as const },
]

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

export default function Sidebar({
  currentPage, onPageChange, isOpen, onToggle, logCount, userCount
}: SidebarProps) {
  const [closeHovered, setCloseHovered] = useState(false)
  const [mainOpen, setMainOpen] = useState(true)
  const [mgmtOpen, setMgmtOpen] = useState(true)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="fixed lg:sticky top-0 left-0 z-40 h-screen w-[260px] flex flex-col border-r shrink-0"
        style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25">
            F
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>FaceAuth AI</h2>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>Biometric Access Control</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden transition-colors"
            style={{ color: closeHovered ? 'white' : 'var(--text-3)' }}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => setMainOpen(!mainOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-4)' }}
          >
            Main
            <motion.div animate={{ rotate: mainOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.div>
          </button>
          <AnimatePresence>
            {mainOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {mainNav.map(item => (
                  <NavButton
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.id}
                    onClick={() => { onPageChange(item.id); if (window.innerWidth < 1024) onToggle() }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px my-2 mx-3" style={{ background: 'var(--badge-bg)' }} />

          <button
            onClick={() => setMgmtOpen(!mgmtOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-4)' }}
          >
            Management
            <motion.div animate={{ rotate: mgmtOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.div>
          </button>
          <AnimatePresence>
            {mgmtOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {mgmtNav.map(item => (
                  <NavButton
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.id}
                    onClick={() => { onPageChange(item.id); if (window.innerWidth < 1024) onToggle() }}
                    badge={item.badge === 'logCount' ? logCount : userCount}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="px-5 py-4 border-t flex items-center gap-2.5 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
            <span className="relative rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 h-2 w-2" />
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>System Online</span>
          <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--text-4)' }}>v2.0</span>
        </div>
      </motion.aside>
    </>
  )
}

function NavButton({
  icon: Icon, label, isActive, onClick, badge
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  isActive: boolean
  onClick: () => void
  badge?: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
      style={{
        color: isActive ? 'var(--text)' : isHovered ? '#e1e1e8' : 'var(--text-2)',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'linear-gradient(to right, rgba(124,58,237,0.15), rgba(6,182,212,0.05))',
            border: '1px solid rgba(124,58,237,0.12)',
            boxShadow: '0 0 20px rgba(124,58,237,0.05)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon
        size={16}
        className="relative z-10 transition-colors"
        style={{
          color: isActive ? 'var(--accent)' : isHovered ? '#e1e1e8' : 'var(--text-3)',
        }}
      />
      <span className="relative z-10">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border relative z-10"
          style={{
            background: 'var(--badge-bg)',
            color: 'var(--text-3)',
            borderColor: 'var(--border)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
