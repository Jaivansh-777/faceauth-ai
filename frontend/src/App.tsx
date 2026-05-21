import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, LayoutDashboard, UserPlus, ScanFace, Activity, Users, Shield, X } from 'lucide-react'
import { ToastProvider } from './components/Toast'
import { fetchStats } from './api'
import { stopCamera } from './camera'

const Dashboard = lazy(() => import('./components/Dashboard'))
const Enroll = lazy(() => import('./components/Enroll'))
const Authenticate = lazy(() => import('./components/Authenticate'))
const ActivityLog = lazy(() => import('./components/ActivityLog'))
const UsersPage = lazy(() => import('./components/Users'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const AdminPinOverlay = lazy(() => import('./components/AdminPinOverlay'))
const NotFoundPage = lazy(() => import('./components/NotFoundPage'))

const validPages = ['dashboard', 'enroll', 'auth', 'logs', 'users', 'admin'] as const
type Page = typeof validPages[number]

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'System overview and metrics' },
  enroll: { title: 'Enroll User', subtitle: 'Register with facial biometrics' },
  auth: { title: 'Authenticate', subtitle: 'Verify identity with face matching' },
  logs: { title: 'Activity Log', subtitle: 'Authentication history' },
  users: { title: 'Users', subtitle: 'Manage enrolled users' },
  admin: { title: 'Admin Panel', subtitle: 'System administration' },
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'enroll', label: 'Enroll', icon: UserPlus },
  { id: 'auth', label: 'Auth', icon: ScanFace },
  { id: 'logs', label: 'Logs', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'admin', label: 'Admin', icon: Shield },
]

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>Loading...</span>
      </div>
    </div>
  )
}

function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function SidebarContent({ currentPage, onNavigate, onClose }: { currentPage: Page; onNavigate: (page: string) => void; onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">F</div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>FaceAuth AI</h2>
          <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Enterprise</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { onNavigate(item.id); onClose?.() }}
            className="relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: currentPage === item.id ? 'var(--nav-active-bg)' : 'transparent',
              color: currentPage === item.id ? 'var(--nav-active-color)' : 'var(--text-2)',
            }}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t flex items-center gap-2.5 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
          <span className="relative rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 h-2 w-2" />
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>System Online</span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--accent)' }}>v2.0</span>
      </div>
    </>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminOverlayOpen, setAdminOverlayOpen] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '')
    const page = path.replace('/', '')
    if (page === 'admin-panel' || page === 'admin') setAdminOverlayOpen(true)
    else if (validPages.includes(page as Page)) setCurrentPage(page as Page)
    else if (path !== '') setNotFound(true)
  }, [])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const page = e.detail as Page
      if (validPages.includes(page)) { setCurrentPage(page); setNotFound(false) }
      setSidebarOpen(false)
    }
    window.addEventListener('navigate', handler as EventListener)
    return () => window.removeEventListener('navigate', handler as EventListener)
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', stopCamera)
    return () => window.removeEventListener('beforeunload', stopCamera)
  }, [])

  const handlePageChange = useCallback((page: string) => {
    const p = page as Page
    if (validPages.includes(p)) { setCurrentPage(p); setNotFound(false) }
    setSidebarOpen(false)
  }, [])

  const handleAdminSuccess = useCallback(() => {
    setAdminUnlocked(true); setAdminOverlayOpen(false); setCurrentPage('admin'); setNotFound(false)
  }, [])

  const handleLock = useCallback(() => { setAdminUnlocked(false); setCurrentPage('dashboard') }, [])

  const meta = pageMeta[currentPage]

  const renderPage = () => {
    if (notFound) return <NotFoundPage />
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'enroll': return <Enroll />
      case 'auth': return <Authenticate />
      case 'logs': return <ActivityLog />
      case 'users': return <UsersPage />
      case 'admin': return adminUnlocked ? <AdminPanel onLock={handleLock} /> : null
      default: return <NotFoundPage />
    }
  }

  return (
    <ToastProvider>
      <div className="app-layout" style={{ background: 'var(--bg)', backgroundImage: 'var(--bg-gradient)' }}>
        {/* Desktop sidebar — part of grid layout, never overlaps */}
        <aside className="hidden lg:flex flex-col border-r min-h-screen sticky top-0 h-screen" style={{
          background: 'var(--sidebar-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--glass-border)',
        }}>
          <SidebarContent currentPage={currentPage} onNavigate={handlePageChange} />
        </aside>

        {/* Mobile drawer overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
        </AnimatePresence>

        {/* Mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-[260px] flex flex-col border-r lg:hidden"
              style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm">F</div>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>FaceAuth AI</h2>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Enterprise</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-3)' }}><X size={18} /></button>
              </div>
              <SidebarContent currentPage={currentPage} onNavigate={handlePageChange} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content — second column of grid */}
        <div className="flex flex-col min-h-screen min-w-0">
          {/* Top navbar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b"
            style={{ background: 'var(--topbar-surface)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden transition-colors" style={{ color: 'var(--text-2)' }}>
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm md:text-base font-semibold truncate tracking-tight" style={{ color: 'var(--text)' }}>
                  {meta?.title || 'FaceAuth AI'}
                </h1>
                <p className="text-[11px] truncate hidden sm:block" style={{ color: 'var(--text-3)' }}>
                  {meta?.subtitle || ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                  <span className="relative rounded-full bg-emerald-500 h-1.5 w-1.5" />
                </span>
                Live
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-400 flex items-center justify-center text-white text-xs font-bold shadow-md">A</div>
            </div>
          </header>

          {/* Page content */}
          <div className="content-area flex-1">
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <PageTransition pageKey={notFound ? '404' : currentPage}>
                  {renderPage()}
                </PageTransition>
              </AnimatePresence>
            </Suspense>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t px-2 py-1.5"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.slice(0, 5).map(item => (
              <button key={item.id} onClick={() => handlePageChange(item.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ color: currentPage === item.id ? 'var(--nav-active-color)' : 'var(--text-3)' }}>
                <item.icon size={18} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <Suspense fallback={null}>
        <AdminPinOverlay open={adminOverlayOpen} onSuccess={handleAdminSuccess} onClose={() => setAdminOverlayOpen(false)} />
      </Suspense>
    </ToastProvider>
  )
}
