'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  CalendarDays, ChevronRight, ChevronLeft, MapPin, Clock,
  Sparkles, CalendarOff, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  WEEKDAYS_AR, WEEKDAYS_AR_SHORT, formatTime12, formatDateAr,
  SUBJECT_AR, STREAM_AR, todayStr, safeJsonParse,
} from '@/lib/solafios'
import { ViewKey } from '@/lib/use-view'

// Saudi week order: Saturday → Friday (JS getDay: 6, 0, 1, 2, 3, 4, 5)
const SAUDI_WEEKDAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
const SAUDI_WEEKDAYS_AR_SHORT = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع']
// Map Saudi week index (0-6) to JS getDay() value
// index 0 = Saturday (JS 6), index 1 = Sunday (JS 0), ..., index 6 = Friday (JS 5)
const SAUDI_TO_JS_DAY = [6, 0, 1, 2, 3, 4, 5]

interface Student {
  id: string
  name: string
  subject: string
  grade: string
  stream: string
  weeklySchedule: string
  sessionTime: string
  phone: string
  status: string
  archived: boolean
  blocked: boolean
  locationRec?: { id: string; name: string } | null
  family?: { id: string; primaryName: string } | null
}

export function ScheduleView({
  setView, setStudentId,
}: {
  setView: (v: ViewKey) => void
  setStudentId: (id: string) => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [filterStream, setFilterStream] = useState('all')
  
  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(d => { setStudents(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  
  // Calculate week range — Saudi week: Saturday to Friday
  // In JS: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // Saturday is the first day of the week in Saudi Arabia
  const weekDates = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()
    // Calculate how many days to go back to reach Saturday
    // If today is Saturday (6), go back 0 days
    // If today is Sunday (0), go back 1 day (to Saturday)
    // If today is Monday (1), go back 2 days
    // ...
    // If today is Friday (5), go back 6 days
    const daysToSaturday = (dayOfWeek + 1) % 7
    const start = new Date(today)
    start.setDate(today.getDate() - daysToSaturday + weekOffset * 7)
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }, [weekOffset])
  
  const weekLabel = useMemo(() => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${formatDateAr(start)} ← ${formatDateAr(end)}`
  }, [weekDates])
  
  // Filter active students
  const activeStudents = useMemo(() => {
    return students.filter(s =>
      !s.archived && !s.blocked && s.status === 'active' &&
      (filterStream === 'all' || s.stream === filterStream)
    )
  }, [students, filterStream])
  
  // Build grid: 7 columns (days) × N rows (students)
  // For each day (Saudi order: Sat→Fri), get students whose weekly schedule includes that JS day
  const grid = useMemo(() => {
    const result: { day: number; jsDay: number; date: string; items: { student: Student; time: string }[] }[] = []
    for (let day = 0; day < 7; day++) {
      const jsDay = SAUDI_TO_JS_DAY[day] // Convert Saudi index to JS getDay()
      const date = weekDates[day]
      const items: { student: Student; time: string }[] = []
      for (const student of activeStudents) {
        const schedule = safeJsonParse<{ day: number; time: string }[]>(student.weeklySchedule, [])
        // schedule uses JS day numbers (0=Sun, 6=Sat)
        const matching = schedule.filter(s => s.day === jsDay)
        for (const s of matching) {
          items.push({ student, time: s.time })
        }
      }
      items.sort((a, b) => a.time.localeCompare(b.time))
      result.push({ day, jsDay, date, items })
    }
    return result
  }, [activeStudents, weekDates])
  
  const todayStr2 = todayStr()
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">الجدول الأسبوعي</h2>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)} className="gap-1">
            <ChevronRight className="w-4 h-4" />
            الأسبوع السابق
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            هذا الأسبوع
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)} className="gap-1">
            الأسبوع القادم
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">النظام:</span>
          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنظمة</SelectItem>
              <SelectItem value="international">دولي</SelectItem>
              <SelectItem value="national">وطني</SelectItem>
              <SelectItem value="ministry">وزاري</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground mr-auto">
            {activeStudents.length} طالب نشط
          </span>
        </CardContent>
      </Card>
      
      {/* Week grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {grid.map(({ day, date, items }) => {
            const isToday = date === todayStr2
            const isPast = date < todayStr2
            return (
              <Card
                key={day}
                className={isToday ? 'border-primary border-2 shadow-md' : ''}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className={isToday ? 'text-primary' : ''}>{SAUDI_WEEKDAYS_AR[day]}</span>
                    </CardTitle>
                    <Badge variant={isToday ? 'default' : 'outline'} className="text-[10px]">
                      {new Date(date + 'T00:00:00').getDate()}
                    </Badge>
                  </div>
                  <p className={`text-[10px] ${isPast ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short' })}
                  </p>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1.5 min-h-[120px]">
                  {items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground/50">
                      <CalendarOff className="w-5 h-5 mx-auto mb-1 opacity-40" />
                      لا جلسات
                    </div>
                  ) : (
                    items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { setStudentId(item.student.id); setView('student-detail') }}
                        className="w-full text-right p-2 rounded-lg border bg-card hover:bg-accent/50 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start gap-1.5">
                          <div className="flex flex-col items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary flex-shrink-0">
                            <span className="text-[9px] font-medium leading-none">
                              {formatTime12(item.time).split(' ')[1]}
                            </span>
                            <span className="text-[11px] font-bold leading-none mt-0.5">
                              {formatTime12(item.time).split(' ')[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate group-hover:text-primary transition-colors">
                              {item.student.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {SUBJECT_AR[item.student.subject] || item.student.subject}
                              {item.student.locationRec && ` · ${item.student.locationRec.name}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Quick stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            توزيع الطلاب على الأيام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {SAUDI_WEEKDAYS_AR_SHORT.map((day, i) => {
              const jsDay = SAUDI_TO_JS_DAY[i]
              const count = activeStudents.filter(s => {
                const sched = safeJsonParse<{ day: number }[]>(s.weeklySchedule, [])
                return sched.some(sc => sc.day === jsDay)
              }).length
              return (
                <div key={i} className="text-center p-2 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground mb-1">{day}</p>
                  <p className="text-lg font-bold text-primary">{count}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
