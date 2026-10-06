'use client'

import { motion } from 'framer-motion'
import { Bike } from 'lucide-react'

// Un toque de movimiento en la landing corta, sin la escena completa del home.
export function HeroAnimado() {
  return (
    <div className="relative mx-auto h-14 w-full max-w-xs overflow-hidden sm:h-16">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--line)] to-transparent" />
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 text-primary"
        initial={{ left: '0%' }}
        animate={{ left: ['0%', '92%', '0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginLeft: -14 }}
      >
        <Bike size={28} strokeWidth={1.75} />
      </motion.div>
    </div>
  )
}
