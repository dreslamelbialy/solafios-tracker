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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus, Search, Phone, MapPin, Pencil, Archive, Trash2, Users, X,
  ChevronLeft, Printer, Ban, MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  STUDENT_STATUS_AR, STUDENT_STATUSES, SUBJECTS, SUBJECT_AR,
  STREAMS, STREAM_AR, BILLING_TYPES, BILLING_TYPE_AR, WEEKDAYS_AR_SHORT,
  formatCurrency, safeJsonParse,
} from '@/lib/solafios'
import { ViewKey } from '@/lib/use-view'

interface Student {
  id: string
  name: string
  subject: string
  grade: string
  stream: string
  pricePerSession: number
  billingType: string
  billingN: number
  weeklyDays: string
  sessionTime: string
  weeklySchedule: string
  phone: string
  notes: string
  status: string
  archived: boolean
  blocked: boolean
  family?: { id: string; primaryName: string } | null
  locationRec?: { id: string; name: string } | null
  year?: { id: string; label: string } | null
  _count?: { sessions: number; payments: number }
}

interface Family { id: string; primaryName: string }
interface Location { id: string; name: string }
interface Year { id: string; label: string }

const SUBJECT_OPTIONS = ['Chemistry', 'Science', 'Physics', 'Biology', 'Math', 'Other']

export function StudentsView({
  setView, setStudentId,
}: {
  setView: (v: ViewKey) => void
  setStudentId: (id: string) => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  
  const [editing, setEditing] = useState<Student | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const loadStudents = () => {
    setLoading(true)
    fetch('/api/students')
      .then(r => r.json())
      .then(d => { setStudents(d); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => {
    loadStudents()
    fetch('/api/families').then(r => r.json()).then(setFamilies)
    fetch('/api/locations').then(r => r.json()).then(setLocations)
    fetch('/api/years').then(r => r.json()).then(setYears)
  }, [])
  
  const filtered = useMemo(() => {
    return students.filter(s => {
      if (search) {
        const q = search.toLowerCase()
        const inName = s.name.toLowerCase().includes(q)
        const inPhone = s.phone?.toLowerCase().includes(q)
        if (!inName && !inPhone) return false
      }
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterSubject !== 'all' && s.subject !== filterSubject) return false
      if (!showArchived && s.archived) return false
      return true
    })
  }, [students, search, filterStatus, filterSubject, showArchived])
  
  const openCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  
  const openEdit = (s: Student) => {
    setEditing(s)
    setSheetOpen(true)
  }
  
  const openDetail = (s: Student) => {
    setStudentId(s.id)
    setView('student-detail')
  }
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        const res = await fetch(`/api/students/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('فشل الحفظ')
        toast.success('تم تحديث بيانات الطالب')
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('فشل الإضافة')
        toast.success('تم إضافة الطالب')
      }
      setSheetOpen(false)
      loadStudents()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطأ')
    }
  }
  
  const handleArchive = async (s: Student) => {
    try {
      await fetch(`/api/students/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !s.archived, status: s.archived ? s.status : 'archived' }),
      })
      toast.success(s.archived ? 'تم استرجاع الطالب' : 'تمت أرشفة الطالب')
      loadStudents()
    } catch {
      toast.error('فشلت الأرشفة')
    }
  }
  
  const handleToggleBlock = async (s: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/students/${s.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !s.blocked }),
      })
      toast.success(s.blocked ? 'تم فك الحظر' : 'تم حظر الطالب')
      loadStudents()
    } catch {
      toast.error('فشل')
    }
  }
  
  const handleWhatsApp = (s: Student, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!s.phone) {
      toast.error('لا يوجد رقم هاتف')
      return
    }
    const phone = s.phone.replace(/[^0-9]/g, '').replace(/^0/, '966')
    const msg = `السلام عليكم ${s.name}، هذا تذكير بموعد الحصة القادمة. شكراً.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  
  const handleDelete = async (s: Student) => {
    if (!confirm(`هل أنت متأكد من حذف ${s.name}؟ سيتم حذف كل جلساته ومدفوعاته.`)) return
    try {
      await fetch(`/api/students/${s.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      loadStudents()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">الطلاب</h2>
          <p className="text-sm text-muted-foreground">
            {formatNumber(filtered.length)} من {formatNumber(students.length)} طالب
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة طالب
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الهاتف…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {STUDENT_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{STUDENT_STATUS_AR[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="المادة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المواد</SelectItem>
                {SUBJECT_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{SUBJECT_AR[s] || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              المؤرشف
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا يوجد طلاب مطابقون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <StudentCard
              key={s.id}
              student={s}
              onOpen={() => openDetail(s)}
              onEdit={() => openEdit(s)}
              onArchive={() => handleArchive(s)}
              onDelete={() => handleDelete(s)}
              onToggleBlock={(e) => handleToggleBlock(s, e)}
              onWhatsApp={(e) => handleWhatsApp(s, e)}
            />
          ))}
        </div>
      )}
      
      {/* Edit/Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle>{editing ? 'تعديل طالب' : 'إضافة طالب جديد'}</SheetTitle>
          </SheetHeader>
          <StudentForm
            student={editing}
            families={families}
            locations={locations}
            years={years}
            onSave={handleSave}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function StudentCard({
  student, onOpen, onEdit, onArchive, onDelete, onToggleBlock, onWhatsApp,
}: {
  student: Student
  onOpen: () => void
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  onToggleBlock: (e: React.MouseEvent) => void
  onWhatsApp: (e: React.MouseEvent) => void
}) {
  const s = student
  const weeklyDays = safeJsonParse<number[]>(s.weeklyDays, [])
  const statusColor = s.status === 'active'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : s.status === 'paused'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  
  return (
    <Card
      className={`${s.archived ? 'opacity-60' : ''} ${s.blocked ? 'border-red-300 dark:border-red-900' : ''} hover:shadow-md transition-shadow cursor-pointer group`}
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                {s.name || 'بدون اسم'}
              </h3>
              {s.blocked && (
                <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-0">
                  محظور
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {SUBJECT_AR[s.subject] || s.subject} · الصف {s.grade} · {STREAM_AR[s.stream] || s.stream}
            </p>
          </div>
          <Badge className={`${statusColor} border-0`} variant="outline">
            {STUDENT_STATUS_AR[s.status] || s.status}
          </Badge>
        </div>
        
        {/* Schedule preview */}
        <div className="flex flex-wrap gap-1 mb-3">
          {weeklyDays.length === 0 ? (
            <span className="text-xs text-muted-foreground">لا يوجد جدول</span>
          ) : (
            weeklyDays.map(d => (
              <span key={d} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                {WEEKDAYS_AR_SHORT[d] || d}
              </span>
            ))
          )}
          {s.sessionTime && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {s.sessionTime}
            </span>
          )}
        </div>
        
        {/* Price + family */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div>
            <span className="text-muted-foreground">السعر: </span>
            <span className="font-bold">{formatCurrency(s.pricePerSession)}</span>
            <span className="text-muted-foreground"> / حصة</span>
          </div>
          {s.family && (
            <Badge variant="outline" className="text-[10px]">
              <Users className="w-3 h-3 ml-1" />
              {s.family.primaryName}
            </Badge>
          )}
        </div>
        
        {/* Phone + location */}
        <div className="space-y-1 text-xs text-muted-foreground mb-3">
          {s.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{s.phone}</span>
            </div>
          )}
          {s.locationRec && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span>{s.locationRec.name}</span>
            </div>
          )}
        </div>
        
        {/* Stats */}
        {s._count && (
          <div className="flex gap-3 text-[11px] text-muted-foreground mb-3 pb-3 border-b">
            <span>{s._count.sessions} جلسة</span>
            <span>·</span>
            <span>{s._count.payments} دفعة</span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={onOpen} className="flex-1 gap-1" title="فتح التفاصيل">
            <ChevronLeft className="w-3 h-3" />
            تفاصيل
          </Button>
          <Button size="sm" variant="ghost" onClick={onWhatsApp} title="واتساب" className="text-emerald-600">
            <MessageCircle className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggleBlock} title={s.blocked ? 'فك الحظر' : 'حظر'} className={s.blocked ? 'text-emerald-600' : 'text-amber-600'}>
            <Ban className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit} title="تعديل">
            <Pencil className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onArchive} title={s.archived ? 'استرجاع' : 'أرشفة'}>
            <Archive className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive" title="حذف">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StudentForm({
  student, families, locations, years, onSave, onCancel,
}: {
  student: Student | null
  families: Family[]
  locations: Location[]
  years: Year[]
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(student?.name || '')
  const [subject, setSubject] = useState(student?.subject || 'Chemistry')
  const [grade, setGrade] = useState(student?.grade || '')
  const [stream, setStream] = useState(student?.stream || 'international')
  const [pricePerSession, setPricePerSession] = useState(student?.pricePerSession || 0)
  const [billingType, setBillingType] = useState(student?.billingType || 'per_n')
  const [billingN, setBillingN] = useState(student?.billingN || 4)
  const [phone, setPhone] = useState(student?.phone || '')
  const [notes, setNotes] = useState(student?.notes || '')
  const [status, setStatus] = useState(student?.status || 'active')
  const [familyId, setFamilyId] = useState(student?.familyId || '')
  const [locationId, setLocationId] = useState(student?.locationId || '')
  const [yearId, setYearId] = useState(student?.yearId || '')
  const [weeklyDays, setWeeklyDays] = useState<number[]>(
    student ? safeJsonParse<number[]>(student.weeklyDays, []) : []
  )
  const [sessionTime, setSessionTime] = useState(student?.sessionTime || '16:00')
  const [saving, setSaving] = useState(false)
  
  const toggleDay = (d: number) => {
    setWeeklyDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }
  
  const submit = async () => {
    if (!name.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    setSaving(true)
    const weeklySchedule = weeklyDays.map(d => ({ day: d, time: sessionTime }))
    onSave({
      name, subject, grade, stream,
      pricePerSession, billingType, billingN,
      phone, notes, status,
      familyId: familyId || null,
      locationId: locationId || null,
      yearId: yearId || null,
      weeklyDays, sessionTime, weeklySchedule,
    })
    setSaving(false)
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">اسم الطالب *</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أحمد محمد" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المادة</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECT_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{SUBJECT_AR[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>الصف</Label>
          <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="6 / 9 / 12" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>النظام</Label>
          <Select value={stream} onValueChange={setStream}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STREAMS.map(s => (
                <SelectItem key={s} value={s}>{STREAM_AR[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>الحالة</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STUDENT_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{STUDENT_STATUS_AR[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>الجدول الأسبوعي</Label>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS_AR_SHORT.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`text-xs py-2 rounded-lg font-medium transition-colors ${
                weeklyDays.includes(i)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs flex-shrink-0">الوقت:</Label>
          <Input
            type="time"
            value={sessionTime}
            onChange={e => setSessionTime(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>السعر للحصة</Label>
          <Input
            type="number"
            value={pricePerSession}
            onChange={e => setPricePerSession(Number(e.target.value))}
            min={0}
          />
        </div>
        <div className="space-y-1.5">
          <Label>نوع الفوترة</Label>
          <Select value={billingType} onValueChange={setBillingType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BILLING_TYPES.map(b => (
                <SelectItem key={b} value={b}>{BILLING_TYPE_AR[b] || b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {billingType === 'per_n' && (
        <div className="space-y-1.5">
          <Label>عدد الحصص في الباقة</Label>
          <Input
            type="number"
            value={billingN}
            onChange={e => setBillingN(Number(e.target.value))}
            min={1}
            max={20}
          />
          <p className="text-[11px] text-muted-foreground">
            يتم الفوترة كل {billingN} حصص
          </p>
        </div>
      )}
      
      <div className="space-y-1.5">
        <Label>الهاتف</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" placeholder="+966…" />
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label>العائلة (اختياري)</Label>
          <Select value={familyId || 'none'} onValueChange={v => setFamilyId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون عائلة</SelectItem>
              {families.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.primaryName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>المكان (اختياري)</Label>
          <Select value={locationId || 'none'} onValueChange={v => setLocationId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون مكان</SelectItem>
              {locations.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>السنة الدراسية (اختياري)</Label>
          <Select value={yearId || 'none'} onValueChange={v => setYearId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون سنة</SelectItem>
              {years.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label>ملاحظات</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>
      
      <div className="flex gap-2 sticky bottom-0 bg-background pt-2 pb-1 border-t">
        <Button onClick={submit} disabled={saving} className="flex-1">
          {saving ? 'جاري الحفظ…' : (student ? 'حفظ التعديلات' : 'إضافة الطالب')}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('ar-SA').format(n || 0)
}
