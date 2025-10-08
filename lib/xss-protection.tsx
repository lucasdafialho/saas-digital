"use client"

import { escapeHtml, sanitizeInput } from './sanitize'

interface XSSProtectionProps {
  children: React.ReactNode
  allowHtml?: boolean
}

export function XSSProtection({ children, allowHtml = false }: XSSProtectionProps) {
  if (typeof children === 'string') {
    return allowHtml ? (
      <span dangerouslySetInnerHTML={{ __html: children }} />
    ) : (
      <span>{escapeHtml(children)}</span>
    )
  }
  
  return <>{children}</>
}

export function SafeText({ 
  text, 
  maxLength = 1000, 
  allowHtml = false 
}: { 
  text: string
  maxLength?: number
  allowHtml?: boolean 
}) {
  const sanitized = sanitizeInput(text, { 
    maxLength, 
    allowHtml,
    stripScripts: true 
  })
  
  return allowHtml ? (
    <span dangerouslySetInnerHTML={{ __html: sanitized }} />
  ) : (
    <span>{sanitized}</span>
  )
}

export function SafeInput({ 
  value, 
  onChange, 
  placeholder = "",
  maxLength = 1000,
  className = ""
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(e.target.value, { 
      maxLength,
      allowHtml: false,
      stripScripts: true
    })
    onChange(sanitized)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
    />
  )
}

export function SafeTextarea({ 
  value, 
  onChange, 
  placeholder = "",
  maxLength = 2000,
  className = "",
  rows = 4
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  rows?: number
}) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitized = sanitizeInput(e.target.value, { 
      maxLength,
      allowHtml: false,
      stripScripts: true
    })
    onChange(sanitized)
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
      rows={rows}
    />
  )
}

export function SafeDisplay({ 
  content, 
  allowHtml = false,
  maxLength = 1000
}: {
  content: string
  allowHtml?: boolean
  maxLength?: number
}) {
  const sanitized = sanitizeInput(content, { 
    maxLength,
    allowHtml,
    stripScripts: true
  })
  
  if (allowHtml) {
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
  }
  
  return <div>{sanitized}</div>
}
