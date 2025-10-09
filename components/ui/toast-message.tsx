"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ToastMessageProps {
  message: string
  type?: "error" | "success" | "info"
  onClose: () => void
  duration?: number
}

export function ToastMessage({ message, type = "error", onClose, duration = 5000 }: ToastMessageProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const styles = {
    error: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      text: "text-destructive-foreground",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-700 dark:text-green-400",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-700 dark:text-blue-400",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const style = styles[type]

  return (
    <div className={`p-4 text-sm ${style.text} ${style.bg} border ${style.border} rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg`}>
      {style.icon}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
