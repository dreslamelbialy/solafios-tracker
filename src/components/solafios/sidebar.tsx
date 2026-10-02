'use client'

import {
  LayoutDashboard, Users, CalendarCheck, Wallet,
  Users2, CalendarOff, MapPin, GraduationCap, Settings,
  Beaker, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewKey } from '@/lib/use-view'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const NAV: { key: ViewKey; label: string; icon: any; group?: string }[] = [
  { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, group: 'main' },
  { key: 'students', label: 'الطلاب', icon: Users, group: 'main' },
  { key: 'sessions', label: 'الجلسات', icon: CalendarCheck, group: 'main' },
  { key: 'payments', label: 'المدفوعات', icon: Wallet, group: 'main' },
  { key: 'families', label: 'العائلات', icon: Users2, group: 'manage' },
  { key: 'holidays', label: 'الإجازات', icon: CalendarOff, group: 'manage' },
  { key: 'locations', label: 'الأماكن', icon: MapPin, group: 'manage' },
  { key: 'years', label: 'السنوات', icon: GraduationCap, group: 'manage' },
  { key: 'settings', label: 'الإعدادات', icon: Settings, group: 'manage' },
]

export function Sidebar({
  view, setView, onNavigate,
}: {
  view: ViewKey
  setView: (v: ViewKey) => void
  onNavigate?: () => void
}) {
  const groups = {
    main: NAV.filter(n => n.group === 'main'),
    manage: NAV.filter(n => n.group === 'manage'),
  }
  
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Beaker className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">سولافيوس تراكر</h1>
          <p className="text-[11px] text-muted-foreground">علوم وكيمياء</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto scroll-area-thin py-3">
        <div className="px-3 mb-1">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3 py-2">الرئيسية</p>
          {groups.main.map(item => (
            <NavButton key={item.key} item={item} active={view === item.key} onClick={() => { setView(item.key); onNavigate?.() }} />
          ))}
        </div>
        
        <div className="px-3 mt-3">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3 py-2">الإدارة</p>
          {groups.manage.map(item => (
            <NavButton key={item.key} item={item} active={view === item.key} onClick={() => { setView(item.key); onNavigate?.() }} />
          ))}
        </div>
      </nav>
      
      <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground text-center">
        <span className="font-medium text-foreground/70">Solafios</span> · الإصدار 2.0
      </div>
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: { label: string; icon: any }, active: boolean, onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-right">{item.label}</span>
      {active && <ChevronRight className="w-4 h-4 opacity-50" />}
    </button>
  )
}

// Mobile header with hamburger
export function MobileHeader({ view, onMenu }: { view: ViewKey, onMenu: () => void }) {
  const current = NAV.find(n => n.key === view)
  const Icon = current?.icon || Beaker
  return (
    <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="flex items-center justify-between p-3">
        <Button variant="ghost" size="sm" onClick={onMenu} className="px-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </Button>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-bold">{current?.label || 'سولافيوس'}</span>
        </div>
        <div className="w-10" />
      </div>
    </header>
  )
}
