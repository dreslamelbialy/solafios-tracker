'use client'

import {
  LayoutDashboard, Users, CalendarCheck, Wallet,
  Users2, CalendarOff, MapPin, GraduationCap, Settings,
  Rss, CalendarDays, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewKey } from '@/lib/use-view'
import { Button } from '@/components/ui/button'

const NAV: { key: ViewKey; label: string; icon: any; group?: string }[] = [
  { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, group: 'main' },
  { key: 'schedule', label: 'الجدول الأسبوعي', icon: CalendarDays, group: 'main' },
  { key: 'calendar', label: 'التقويم', icon: Calendar, group: 'main' },
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
    <div className="flex h-full flex-col">
      {/* Logo header — Dribbble style: avatar circle + name */}
      <div className="flex items-center gap-3 p-5 border-b border-white/30">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Rss className="w-6 h-6 text-primary-foreground" />
          </div>
          {/* Status indicator dot (like Dribbble) */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight truncate">سولافيوس</h1>
          <p className="text-[11px] text-muted-foreground">علوم وكيمياء</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto scroll-area-thin py-4 px-3">
        <div className="mb-2">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 py-2">الرئيسية</p>
          <div className="space-y-1">
            {groups.main.map(item => (
              <NavButton key={item.key} item={item} active={view === item.key} onClick={() => { setView(item.key); onNavigate?.() }} />
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 py-2">الإدارة</p>
          <div className="space-y-1">
            {groups.manage.map(item => (
              <NavButton key={item.key} item={item} active={view === item.key} onClick={() => { setView(item.key); onNavigate?.() }} />
            ))}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-white/30">
        <div className="rounded-2xl bg-white/50 backdrop-blur-sm p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-bold text-foreground">Solafios</span> · v2.1
          </p>
        </div>
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
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all group',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]'
          : 'text-sidebar-foreground/70 hover:bg-white/50 hover:text-sidebar-foreground'
      )}
    >
      {/* Icon circle — Dribbble style */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0',
        active
          ? 'bg-primary-foreground/20'
          : 'bg-white/60 group-hover:bg-white'
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-right">{item.label}</span>
    </button>
  )
}

// Mobile header — Dribbble style
export function MobileHeader({ view, onMenu }: { view: ViewKey, onMenu: () => void }) {
  const current = NAV.find(n => n.key === view)
  const Icon = current?.icon || Rss
  return (
    <header className="md:hidden sticky top-0 z-30 glass-header border-b border-white/30">
      <div className="flex items-center justify-between p-3">
        <Button variant="ghost" size="sm" onClick={onMenu} className="px-2 rounded-full w-10 h-10 p-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold">{current?.label || 'سولافيوس'}</span>
        </div>
        <div className="w-10" />
      </div>
    </header>
  )
}
