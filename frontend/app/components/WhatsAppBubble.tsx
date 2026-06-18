'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'whatsapp-bubble-dismissed'

export default function WhatsAppBubble() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative bg-white text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap">
        Chat with us on WhatsApp
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
        {/* Arrow pointing down toward the button */}
        <span className="absolute -bottom-1.75 right-5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white" />
        <span className="absolute -bottom-2 right-5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-gray-100" style={{zIndex: -1}} />
      </div>
    </div>
  )
}
