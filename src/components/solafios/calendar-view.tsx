'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChevronRight, ChevronLeft, CalendarDays, Clock, MapPin,
  LayoutGrid, Calendar as CalendarIcon, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  WEEKDAYS_AR, WEEKDAYS_AR_SHORT, formatTime12, formatDateAr,
  SUBJECT_AR, STREAM_AR, SESSION_STATUS_AR, SESSION_STATUS_COLORS,
  todayStr, safeJsonParse,
} from '@/lib/solafios'
import { ViewKey } from '@/lib/use-view'

interface Session {
  id: string
  date: string
  time: string
  status: string
  topic: string
  student: {
    id: string
    name: string
    subject: string
    grade: string
    stream: string
    locationRec?: { name: string } | null
  }
}

type ViewMode = 'month' | 'day'

export function CalendarView({
  setView, setStudentId,
}: {
  setView: (v: ViewKey) => void
  setStudentId: (id: string) => void
}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ViewMode>('month')
  
  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  
  // Day navigation
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  
  // Load sessions for current view
  useEffect(() => {
    setLoading(true)
    let fromDate: string, toDate: string
    
    if (mode === 'month') {
      const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
      const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
      fromDate = firstDay.toISOString().slice(0, 10)
      toDate = lastDay.toISOString().slice(0, 10)
    } else {
      fromDate = selectedDate
      toDate = selectedDate
    }
    
    fetch(`/api/sessions?from=${fromDate}&to=${toDate}&limit=500`)
      .then(r => r.json())
      .then(d => { setSessions(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [mode, currentMonth, selectedDate])
  
  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of sessions) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    }
    // Sort each day by time
    for (const items of map.values()) {
      items.sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [sessions])
  
  // Month grid (6 weeks × 7 days)
  const monthGrid = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday
    
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = []
    const today = todayStr()
    
    // Previous month's trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentMonth.year, currentMonth.month, -i)
      days.push({
        date: d.toISOString().slice(0, 10),
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toISOString().slice(0, 10) === today,
      })
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(currentMonth.year, currentMonth.month, i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
      })
    }
    
    // Next month's leading days (fill to 42)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentMonth.year, currentMonth.month + 1, i)
      days.push({
        date: d.toISOString().slice(0, 10),
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toISOString().slice(0, 10) === today,
      })
    }
    
    return days
  }, [currentMonth])
  
  const monthLabel = useMemo(() => {
    const d = new Date(currentMonth.year, currentMonth.month, 1)
    return d.toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long' })
  }, [currentMonth])
  
  const shiftMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }
  
  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().slice(0, 10))
  }
  
  const todaySessions = sessionsByDate.get(selectedDate) || []
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'month' ? 'التقويم الشهري' : 'الجدول اليومي'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'month' ? monthLabel : formatDateAr(selectedDate)}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            <Button
              size="sm"
              variant={mode === 'month' ? 'default' : 'ghost'}
              onClick={() => setMode('month')}
              className="gap-1"
            >
              <CalendarIcon className="w-4 h-4" />
              شهري
            </Button>
            <Button
              size="sm"
              variant={mode === 'day' ? 'default' : 'ghost'}
              onClick={() => setMode('day')}
              className="gap-1"
            >
              <LayoutGrid className="w-4 h-4" />
              يومي
            </Button>
          </div>
          
          {mode === 'month' ? (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const d = new Date()
                setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
              }}>
                هذا الشهر
              </Button>
              <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => shiftDay(-1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(todayStr())}>
                اليوم
              </Button>
              <Button variant="outline" size="sm" onClick={() => shiftDay(1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Month view */}
      {mode === 'month' && (
        <Card>
          <CardContent className="p-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS_AR_SHORT.map((day, i) => (
                <div key={i} className="text-center text-xs font-bold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((day, i) => {
                const daySessions = sessionsByDate.get(day.date) || []
                const hasSessions = daySessions.length > 0
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(day.date)
                      setMode('day')
                    }}
                    className={`min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border text-right transition-all hover:shadow-sm ${
                      day.isToday
                        ? 'bg-primary/15 border-primary border-2'
                        : day.isCurrentMonth
                        ? 'bg-card hover:bg-accent/50 border-border'
                        : 'bg-muted/20 border-transparent text-muted-foreground/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${
                        day.isToday ? 'text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                      }`}>
                        {day.day}
                      </span>
                      {hasSessions && (
                        <span className="text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">
                          {daySessions.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Session chips */}
                    <div className="space-y-0.5">
                      {daySessions.slice(0, 3).map(s => (
                        <div
                          key={s.id}
                          className={`text-[9px] px-1 py-0.5 rounded truncate ${
                            s.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : s.status === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-primary/10 text-primary'
                          }`}
                          title={`${s.student.name} - ${formatTime12(s.time)}`}
                        >
                          <span className="font-bold">{formatTime12(s.time).split(' ')[0]}</span>
                          {' '}
                          {s.student.name.split(' ')[0]}
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <div className="text-[9px] text-muted-foreground px-1">
                          +{daySessions.length - 3}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Day view */}
      {mode === 'day' && (
        <div className="space-y-3">
          {/* Date header */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{formatDateAr(selectedDate)}</p>
                <p className="text-2xl font-bold mt-1">
                  {todaySessions.length} حصة مجدولة
                </p>
              </div>
              <CalendarDays className="w-10 h-10 text-primary/40" />
            </CardContent>
          </Card>
          
          {/* Sessions timeline */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
          ) : todaySessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">لا توجد جلسات في هذا اليوم</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setMode('month')}
                >
                  العودة للتقويم الشهري
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todaySessions.map(s => (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Time block */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <span className="text-[10px] font-medium leading-none">
                          {formatTime12(s.time).split(' ')[1]}
                        </span>
                        <span className="text-base font-bold leading-none mt-0.5">
                          {formatTime12(s.time).split(' ')[0]}
                        </span>
                      </div>
                      
                      {/* Student info */}
                      <button
                        onClick={() => { setStudentId(s.student.id); setView('student-detail') }}
                        className="flex-1 min-w-0 text-right"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm hover:text-primary transition-colors">
                            {s.student.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-[10px] border-0 ${SESSION_STATUS_COLORS[s.status] || ''}`}
                          >
                            {SESSION_STATUS_AR[s.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {SUBJECT_AR[s.student.subject] || s.student.subject}
                          {' · '}الصف {s.student.grade}
                          {' · '}{STREAM_AR[s.student.stream] || s.student.stream}
                          {s.topic && ` · ${s.topic}`}
                        </p>
                        {s.student.locationRec && (
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {s.student.locationRec.name}
                          </p>
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Stats footer (month mode) */}
      {mode === 'month' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              إحصائيات الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">إجمالي الجلسات</p>
                <p className="text-lg font-bold">{sessions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-xs text-muted-foreground">تامة</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {sessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-xs text-muted-foreground">مجدولة</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {sessions.filter(s => s.status === 'scheduled').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-xs text-muted-foreground">ملغاة</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {sessions.filter(s => s.status.startsWith('cancelled')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
