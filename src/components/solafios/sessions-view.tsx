'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Plus, CalendarCheck, Sparkles, ChevronRight, ChevronLeft,
  Check, X, Clock, Trash2, CalendarOff,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  SESSION_STATUSES, SESSION_STATUS_AR, SESSION_STATUS_COLORS,
  SUBJECT_AR, STREAM_AR, WEEKDAYS_AR, formatTime12, formatDateAr,
  formatCurrency, todayStr,
} from '@/lib/solafios'

interface Session {
  id: string
  studentId: string
  date: string
  time: string
  status: string
  cancelReason: string | null
  cancelledBy: string | null
  owedMakeup: boolean
  chargedToParent: boolean
  topic: string
  homework: string
  billed: boolean
  paymentId: string | null
  isExtra: boolean
  isHistorical: boolean
  student: {
    id: string
    name: string
    subject: string
    grade: string
    stream: string
    pricePerSession: number
    billingType: string
    billingN: number
  }
  payment?: { id: string; amount: number; date: string; type: string } | null
}

export function SessionsView() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState<string>(todayStr())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterStudent, setFilterStudent] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'day' | 'all'>('day')
  
  // Edit sheet
  const [editing, setEditing] = useState<Session | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // Generate dialog
  const [genOpen, setGenOpen] = useState(false)
  
  const loadSessions = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (viewMode === 'day' && filterDate) params.set('date', filterDate)
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterStudent !== 'all') params.set('studentId', filterStudent)
    fetch('/api/sessions?' + params.toString())
      .then(r => r.json())
      .then(d => { setSessions(d); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => { loadSessions() }, [filterDate, filterStatus, filterStudent, viewMode])
  
  // Group sessions by date if in 'all' mode
  const grouped = useMemo(() => {
    if (viewMode === 'day') return [{ date: filterDate, items: sessions }]
    const groups: { date: string; items: Session[] }[] = []
    const map = new Map<string, Session[]>()
    for (const s of sessions) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    }
    for (const [date, items] of map) {
      groups.push({ date, items })
    }
    groups.sort((a, b) => b.date.localeCompare(a.date))
    return groups
  }, [sessions, viewMode, filterDate])
  
  const shiftDate = (days: number) => {
    const d = new Date(filterDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setFilterDate(d.toISOString().slice(0, 10))
  }
  
  const handleStatusChange = async (s: Session, status: string) => {
    try {
      await fetch(`/api/sessions/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`تم تحديث الحالة: ${SESSION_STATUS_AR[status]}`)
      loadSessions()
    } catch {
      toast.error('فشل التحديث')
    }
  }
  
  const handleDelete = async (s: Session) => {
    if (!confirm('حذف هذه الجلسة؟')) return
    try {
      await fetch(`/api/sessions/${s.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      loadSessions()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  const handleGenerate = async (weeks: number) => {
    try {
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks, fromDate: todayStr() }),
      })
      const data = await res.json()
      if (data.created > 0) {
        toast.success(`تم إنشاء ${data.created} جلسة جديدة`)
      } else {
        toast.info('لا توجد جلسات جديدة — كل الجلسات موجودة بالفعل')
      }
      setGenOpen(false)
      loadSessions()
    } catch {
      toast.error('فشل التوليد')
    }
  }
  
  const handleSaveEdit = async (data: any) => {
    try {
      await fetch(`/api/sessions/${editing!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast.success('تم الحفظ')
      setSheetOpen(false)
      loadSessions()
    } catch {
      toast.error('فشل الحفظ')
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">الجلسات</h2>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'day' ? formatDateAr(filterDate) : `${sessions.length} جلسة`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenOpen(true)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            توليد الجلسات
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewMode === 'day' ? 'default' : 'outline'}
                onClick={() => setViewMode('day')}
              >يوم</Button>
              <Button
                size="sm"
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
              >الكل</Button>
            </div>
            
            {viewMode === 'day' && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => shiftDate(-1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-[160px]"
                />
                <Button size="sm" variant="ghost" onClick={() => shiftDate(1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFilterDate(todayStr())}>
                  اليوم
                </Button>
              </div>
            )}
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {SESSION_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{SESSION_STATUS_AR[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="الطالب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطلاب</SelectItem>
                {/* populated from sessions list */}
                {Array.from(new Set(sessions.map(s => s.student.id))).map(sid => {
                  const s = sessions.find(x => x.student.id === sid)!
                  return (
                    <SelectItem key={sid} value={sid}>{s.student.name}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Sessions grouped by date */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setGenOpen(true)}>
              <Sparkles className="w-4 h-4 ml-2" />
              توليد الجلسات القادمة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.date}>
              {viewMode === 'all' && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-sm">{formatDateAr(group.date)}</h3>
                  <Badge variant="outline" className="text-[10px]">{group.items.length} جلسة</Badge>
                </div>
              )}
              <div className="space-y-2">
                {group.items
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(s => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    onEdit={() => { setEditing(s); setSheetOpen(true) }}
                    onStatusChange={(st) => handleStatusChange(s, st)}
                    onDelete={() => handleDelete(s)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle>تعديل الجلسة</SheetTitle>
          </SheetHeader>
          {editing && (
            <SessionForm
              session={editing}
              onSave={handleSaveEdit}
              onCancel={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
      
      {/* Generate dialog */}
      {genOpen && (
        <GenerateDialog
          onClose={() => setGenOpen(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  )
}

function SessionRow({
  session, onEdit, onStatusChange, onDelete,
}: {
  session: Session
  onEdit: () => void
  onStatusChange: (status: string) => void
  onDelete: () => void
}) {
  const s = session
  const statusBadge = (
    <Badge
      variant="outline"
      className={`text-[10px] border-0 ${SESSION_STATUS_COLORS[s.status] || ''}`}
    >
      {SESSION_STATUS_AR[s.status] || s.status}
    </Badge>
  )
  
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Time block */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <span className="text-[10px] font-medium leading-none">{formatTime12(s.time).split(' ')[1]}</span>
            <span className="text-sm font-bold leading-none mt-0.5">{formatTime12(s.time).split(' ')[0]}</span>
          </div>
          
          {/* Student info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm truncate">{s.student.name}</h3>
              {s.isExtra && <Badge variant="outline" className="text-[10px]">إضافية</Badge>}
              {s.billed && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-0">مفوترة</Badge>}
              {s.owedMakeup && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-0">تعويض</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {SUBJECT_AR[s.student.subject] || s.student.subject} · الصف {s.student.grade}
              {s.topic && ` · ${s.topic}`}
            </p>
            {s.homework && (
              <p className="text-xs mt-1 text-muted-foreground/80 line-clamp-1">
                📚 {s.homework}
              </p>
            )}
          </div>
          
          {/* Status + actions */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {statusBadge}
            <div className="flex gap-1">
              {s.status === 'scheduled' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
                    onClick={() => onStatusChange('completed')}
                    title="إتمام"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={() => onStatusChange('cancelled')}
                    title="إلغاء"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {s.status === 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onStatusChange('scheduled')}
                  title="إعادة جدولة"
                >
                  <Clock className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive"
                onClick={onDelete}
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionForm({
  session, onSave, onCancel,
}: {
  session: Session
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(session.date)
  const [time, setTime] = useState(session.time)
  const [status, setStatus] = useState(session.status)
  const [topic, setTopic] = useState(session.topic || '')
  const [homework, setHomework] = useState(session.homework || '')
  const [cancelReason, setCancelReason] = useState(session.cancelReason || '')
  const [cancelledBy, setCancelledBy] = useState(session.cancelledBy || '')
  const [owedMakeup, setOwedMakeup] = useState(session.owedMakeup)
  const [chargedToParent, setChargedToParent] = useState(session.chargedToParent)
  const [isExtra, setIsExtra] = useState(session.isExtra)
  
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <p className="font-bold">{session.student.name}</p>
        <p className="text-xs text-muted-foreground">
          {SUBJECT_AR[session.student.subject] || session.student.subject} · الصف {session.student.grade}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>التاريخ</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>الوقت</Label>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label>الحالة</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SESSION_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{SESSION_STATUS_AR[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {status.startsWith('cancelled') || status === 'no_show' ? (
        <>
          <div className="space-y-1.5">
            <Label>ألغيت بواسطة</Label>
            <Select value={cancelledBy || 'none'} onValueChange={v => setCancelledBy(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="teacher">المدرس</SelectItem>
                <SelectItem value="student">الطالب</SelectItem>
                <SelectItem value="other">آخر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>سبب الإلغاء</Label>
            <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="owedMakeup"
              checked={owedMakeup}
              onChange={e => setOwedMakeup(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="owedMakeup" className="text-sm font-normal cursor-pointer">
              يستحق تعويض (makeup)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chargedToParent"
              checked={chargedToParent}
              onChange={e => setChargedToParent(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="chargedToParent" className="text-sm font-normal cursor-pointer">
              تُحسب على ولي الأمر
            </Label>
          </div>
        </>
      ) : null}
      
      <div className="space-y-1.5">
        <Label>موضوع الحصة</Label>
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="مثال: الفصل 3 — الذرة" />
      </div>
      
      <div className="space-y-1.5">
        <Label>الواجب</Label>
        <Textarea value={homework} onChange={e => setHomework(e.target.value)} rows={2} placeholder="مثال: تمارين صفحة 45" />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isExtra"
          checked={isExtra}
          onChange={e => setIsExtra(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="isExtra" className="text-sm font-normal cursor-pointer">
          حصة إضافية (خارج الجدول الأسبوعي)
        </Label>
      </div>
      
      <div className="flex gap-2 sticky bottom-0 bg-background pt-2 pb-1 border-t">
        <Button onClick={() => onSave({ date, time, status, topic, homework, cancelReason, cancelledBy, owedMakeup, chargedToParent, isExtra })} className="flex-1">
          حفظ
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}

function GenerateDialog({
  onClose, onGenerate,
}: {
  onClose: () => void
  onGenerate: (weeks: number) => void
}) {
  const [weeks, setWeeks] = useState(4)
  const [preview, setPreview] = useState<{ count: number; items: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const runPreview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks, dryRun: true }),
      })
      const data = await res.json()
      setPreview({ count: data.wouldCreate, items: data.items || [] })
    } catch {
      toast.error('فشل المعاينة')
    }
    setLoading(false)
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            توليد الجلسات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            سيتم توليد الجلسات تلقائياً من الجدول الأسبوعي لكل طالب نشط، مع تخطي الإجازات والجلسات الموجودة.
          </p>
          <div className="space-y-1.5">
            <Label>عدد الأسابيع القادمة</Label>
            <Select value={String(weeks)} onValueChange={v => { setWeeks(Number(v)); setPreview(null) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">أسبوع واحد</SelectItem>
                <SelectItem value="2">أسبوعين</SelectItem>
                <SelectItem value="4">4 أسابيع</SelectItem>
                <SelectItem value="8">8 أسابيع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {preview && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-bold">سيتم إنشاء {preview.count} جلسة جديدة</p>
              {preview.items.slice(0, 5).map((it, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1">
                  · {it.date} {it.time} — الطالب: {it.studentId.slice(-4)}
                </p>
              ))}
              {preview.items.length > 5 && (
                <p className="text-xs text-muted-foreground mt-1">… و {preview.items.length - 5} أخرى</p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={runPreview} disabled={loading} className="flex-1">
              {loading ? 'جاري…' : 'معاينة'}
            </Button>
            <Button onClick={() => onGenerate(weeks)} className="flex-1">
              توليد
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full">إغلاق</Button>
        </CardContent>
      </Card>
    </div>
  )
}
