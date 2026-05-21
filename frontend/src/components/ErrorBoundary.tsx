import { Component, type ReactNode, type ErrorInfo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) {}
  handleReset = () => { this.setState({ hasError: false, error: null }) }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', backgroundImage: 'var(--bg-gradient)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Something went wrong</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>An unexpected error occurred. Please try refreshing.</p>
            <button onClick={this.handleReset} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
              <RefreshCw size={16} /> Try Again
            </button>
          </motion.div>
        </div>
      )
    }
    return this.props.children
  }
}
