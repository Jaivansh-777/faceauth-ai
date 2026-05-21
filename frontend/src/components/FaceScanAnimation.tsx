import { motion } from 'framer-motion'

export default function FaceScanAnimation({ size = 140 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '1px solid rgba(99,102,241,0.15)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-3 rounded-full"
        style={{ border: '1px solid rgba(14,165,233,0.2)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.div
        className="absolute inset-6 rounded-full"
        style={{ border: '1px solid rgba(99,102,241,0.25)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <div className="absolute inset-[18px] rounded-full flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.08))',
        backdropFilter: 'blur(2px)',
      }}>
        <svg viewBox="0 0 24 24" className="w-[35%] h-[35%]" fill="none" stroke="url(#faceGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="faceGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10" r="1.2" fill="currentColor" />
          <circle cx="15" cy="10" r="1.2" fill="currentColor" />
          <path d="M8 14c1.5 1.5 6.5 1.5 8 0" />
        </svg>
      </div>
      <motion.div
        className="absolute left-[15%] right-[15%] h-[1.5px] rounded-full blur-[1px]"
        style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.4), transparent)' }}
        animate={{ top: ['20%', '78%', '20%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-[25%] right-[25%] h-[1px] rounded-full"
        style={{ background: 'linear-gradient(to right, transparent, rgba(14,165,233,0.3), transparent)' }}
        animate={{ top: ['30%', '68%', '30%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', delay: 0.6 }}
      />
    </div>
  )
}
