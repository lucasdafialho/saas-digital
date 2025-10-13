"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-2xl p-6 space-y-4",
      className
    )}>
      {children}
    </div>
  )
}

export function DialogHeader({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn("text-xl font-semibold text-white", className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm text-gray-400", className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ 
  children,
  className 
}: { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex justify-end gap-3 mt-6", className)}>
      {children}
    </div>
  )
}

export function DialogTrigger({ 
  children,
  asChild,
  ...props
}: { 
  children: React.ReactNode
  asChild?: boolean
  [key: string]: any
}) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props)
  }
  return <div {...props}>{children}</div>
}
