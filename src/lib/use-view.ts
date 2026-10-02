'use client'

import { useEffect, useState } from 'react'

// Lightweight global store for Solafios view state
// Persists current view + theme in localStorage

export type ViewKey =
  | 'dashboard'
  | 'students'
  | 'student-detail'
  | 'schedule'
  | 'calendar'
  | 'sessions'
  | 'payments'
  | 'families'
  | 'holidays'
  | 'locations'
  | 'years'
  | 'settings'

const KEY = 'solafios:view'

export function useView() {
  const [view, setViewState] = useState<ViewKey>('dashboard')
  const [studentId, setStudentId] = useState<string | null>(null)
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as ViewKey | null
      if (saved) setViewState(saved)
    } catch {}
  }, [])
  
  const setView = (v: ViewKey) => {
    setViewState(v)
    try { localStorage.setItem(KEY, v) } catch {}
    // scroll to top on view change
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return { view, setView, studentId, setStudentId }
}

// Toast helper via sonner
import { toast } from 'sonner'
export { toast }
