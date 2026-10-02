'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowRight, Phone, MapPin, Pencil, Plus, Check, X, Clock,
  Wallet, CalendarCheck, BookOpen, Star, Printer, Ban,
  MessageCircle, Trash2, RefreshCw, GraduationCap, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  STUDENT_STATUS_AR, SUBJECT_AR, STREAM_AR, BILLING_TYPE_AR,
  SESSION_STATUS_AR, SESSION_STATUS_COLORS, PAYMENT_TYPE_AR,
  WEEKDAYS_AR_SHORT, formatCurrency, formatDateAr, formatTime12,
  safeJsonParse, todayStr,
} from '@/lib/solafios'
import { ViewKey } from '@/lib/use-view'

interface StudentDetail {
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
  curriculumProgress: string
  evaluation: string
  family?: { id: string; primaryName: string; primaryPhone: string | null } | null
  locationRec?: { id: string; name: string; address: string | null; lat: number | null; lng: number | null } | null
  year?: { id: string; label: string } | null
  sessions: Session[]
  payments: Payment[]
  _count?: { sessions: number; payments: number }
}

interface Session {
  id: string
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
  isExtra: boolean
  isHistorical: boolean
}

interface Payment {
  id: string
  amount: number
  type: string
  date: string
  notes: string | null
  sessionCount: number
  isHistorical: boolean
}

export function StudentDetailView({
  studentId, setView,
}: {
  studentId: string | null
  setView: (v: ViewKey) => void
}) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  
  const load = () => {
    if (!studentId) return
    setLoading(true)
    fetch(`/api/students/${studentId}`)
      .then(r => r.json())
      .then(d => { setStudent(d); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => { load() }, [studentId])
  
  if (!studentId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لم يتم اختيار طالب</p>
        <Button onClick={() => setView('students')} className="mt-3">العودة للطلاب</Button>
      </div>
    )
  }
  
  if (loading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        </div>
      </div>
    )
  }
  
  const weeklyDays = safeJsonParse<number[]>(student.weeklyDays, [])
  const totalPaid = student.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const unbilledSessions = student.sessions.filter(s => s.status === 'completed' && !s.billed && !s.isHistorical)
  
  // RULE: الحصص هي الفيصل — المستحق = عدد الحصص × سعر الحصة (بصرف النظر عن billingType)
  const outstandingAmount = unbilledSessions.length * student.pricePerSession
  
  const handleStatusChange = async (sessionId: string, status: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`تم تحديث الحالة: ${SESSION_STATUS_AR[status]}`)
      load()
    } catch {
      toast.error('فشل التحديث')
    }
  }
  
  const handleToggleBlock = async () => {
    try {
      await fetch(`/api/students/${student.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !student.blocked }),
      })
      toast.success(student.blocked ? 'تم فك الحظر' : 'تم حظر الطالب')
      load()
    } catch {
      toast.error('فشل')
    }
  }
  
  const handleWhatsApp = () => {
    if (!student.phone) {
      toast.error('لا يوجد رقم هاتف')
      return
    }
    const phone = student.phone.replace(/[^0-9]/g, '').replace(/^0/, '966')
    const msg = `السلام عليكم ${student.name}، هذا تذكير بموعد الحصة القادمة. شكراً.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => setView('students')} className="gap-1">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold truncate">{student.name}</h2>
              {student.blocked && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-0">محظور</Badge>}
              <Badge variant="outline" className="text-[10px]">
                {STUDENT_STATUS_AR[student.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {SUBJECT_AR[student.subject] || student.subject} · الصف {student.grade} · {STREAM_AR[student.stream]}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="gap-1">
            <Printer className="w-4 h-4" />
            تقرير
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1 text-emerald-600">
            <MessageCircle className="w-4 h-4" />
            واتساب
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleBlock} className={student.blocked ? 'text-emerald-600' : 'text-amber-600'}>
            <Ban className="w-4 h-4" />
            {student.blocked ? 'فك الحظر' : 'حظر'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">السعر للحصة</p>
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold tabular">{formatCurrency(student.pricePerSession)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">سعر الحصة الواحدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">إجمالي المدفوع</p>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-lg font-bold tabular text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{student.payments.length} دفعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">المستحق حالياً</p>
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-lg font-bold tabular text-amber-700 dark:text-amber-300">{formatCurrency(outstandingAmount)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {unbilledSessions.length} حصة × {formatCurrency(student.pricePerSession)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">إجمالي الجلسات</p>
              <CalendarCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold tabular">{student._count?.sessions || student.sessions.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {student.sessions.filter(s => s.status === 'completed').length} تامة
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">نظرة عامة</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">الجلسات</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">المدفوعات</TabsTrigger>
          <TabsTrigger value="curriculum" className="text-xs">المنهج</TabsTrigger>
          <TabsTrigger value="evaluation" className="text-xs">التقييم</TabsTrigger>
        </TabsList>
        
        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الجدول الأسبوعي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {weeklyDays.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا يوجد جدول محدد</p>
                  ) : (
                    weeklyDays.map(d => (
                      <Badge key={d} variant="outline" className="bg-primary/10 text-primary border-0">
                        {WEEKDAYS_AR_SHORT[d]}
                      </Badge>
                    ))
                  )}
                  {student.sessionTime && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                      <Clock className="w-3 h-3 ml-1" />
                      {formatTime12(student.sessionTime)}
                    </Badge>
                  )}
                </div>
                {student.family && (
                  <div className="text-xs text-muted-foreground mb-2">
                    <strong>العائلة:</strong> {student.family.primaryName}
                    {student.family.primaryPhone && (
                      <span className="mr-2" dir="ltr">{student.family.primaryPhone}</span>
                    )}
                  </div>
                )}
                {student.locationRec && (
                  <a
                    href={`https://www.google.com/maps?q=${student.locationRec.lat},${student.locationRec.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="w-3 h-3" />
                    {student.locationRec.name}
                  </a>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.phone ? (
                  <a href={`tel:${student.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{student.phone}</span>
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">لا يوجد رقم هاتف</p>
                )}
                {student.year && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>السنة: {student.year.label}</span>
                  </div>
                )}
                {student.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                    <p className="text-sm">{student.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick recent sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">آخر الجلسات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-64 overflow-y-auto scroll-area-thin">
              {student.sessions.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{formatDateAr(s.date)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime12(s.time)} · {s.topic || '—'}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] border-0 ${SESSION_STATUS_COLORS[s.status] || ''}`}>
                    {SESSION_STATUS_AR[s.status]}
                  </Badge>
                </div>
              ))}
              {student.sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">لا جلسات</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sessions */}
        <TabsContent value="sessions" className="space-y-2">
          {student.sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-sm text-muted-foreground">
                لا توجد جلسات مسجلة
              </CardContent>
            </Card>
          ) : (
            student.sessions.map(s => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <span className="text-[10px] leading-none">{formatTime12(s.time).split(' ')[1]}</span>
                      <span className="text-sm font-bold leading-none mt-0.5">{formatTime12(s.time).split(' ')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{formatDateAr(s.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.topic || 'بدون موضوع'}
                        {s.billed && ' · مفوترة'}
                        {s.isExtra && ' · إضافية'}
                        {s.owedMakeup && ' · تعويض'}
                      </p>
                      {s.homework && (
                        <p className="text-xs mt-1 text-muted-foreground/80">📚 {s.homework}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] border-0 ${SESSION_STATUS_COLORS[s.status] || ''}`}>
                        {SESSION_STATUS_AR[s.status]}
                      </Badge>
                      <div className="flex gap-1">
                        {s.status === 'scheduled' && (
                          <>
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 w-6 p-0 text-emerald-600"
                              onClick={() => handleStatusChange(s.id, 'completed')}
                              title="إتمام"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 w-6 p-0 text-red-600"
                              onClick={() => handleStatusChange(s.id, 'cancelled')}
                              title="إلغاء"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {s.status === 'completed' && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleStatusChange(s.id, 'scheduled')}
                            title="إعادة جدولة"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* Payments */}
        <TabsContent value="payments" className="space-y-2">
          {student.payments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-sm text-muted-foreground">
                لا توجد مدفوعات مسجلة
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي المدفوع</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-600/60" />
                </CardContent>
              </Card>
              
              {student.payments.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{formatDateAr(p.date)}</p>
                          <Badge variant="outline" className="text-[10px]">{PAYMENT_TYPE_AR[p.type] || p.type}</Badge>
                          {p.isHistorical && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-0">تاريخية</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.sessionCount > 0 ? `${p.sessionCount} جلسة` : 'دفعة بدون جلسات'}
                          {p.notes && ` · ${p.notes}`}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(p.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
        
        {/* Curriculum */}
        <TabsContent value="curriculum">
          <CurriculumTab student={student} onUpdate={load} />
        </TabsContent>
        
        {/* Evaluation */}
        <TabsContent value="evaluation">
          <EvaluationTab student={student} onUpdate={load} />
        </TabsContent>
      </Tabs>
      
      {/* Edit sheet */}
      {editOpen && (
        <EditStudentSheet
          student={student}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); load() }}
        />
      )}
      
      {/* Report */}
      {reportOpen && (
        <ReportDialog
          studentId={student.id}
          studentName={student.name}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

// ============================================================
// Curriculum tab — track syllabus progress
// ============================================================
function CurriculumTab({ student, onUpdate }: { student: StudentDetail, onUpdate: () => void }) {
  const [items, setItems] = useState<{ chapter: string; completed: boolean; notes: string; date: string }[]>(
    safeJsonParse(student.curriculumProgress, [])
  )
  const [newChapter, setNewChapter] = useState('')
  const [saving, setSaving] = useState(false)
  
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/students/${student.id}/curriculum`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumProgress: items }),
      })
      toast.success('تم حفظ المنهج')
      onUpdate()
    } catch {
      toast.error('فشل الحفظ')
    }
    setSaving(false)
  }
  
  const addChapter = () => {
    if (!newChapter.trim()) return
    setItems(prev => [...prev, {
      chapter: newChapter.trim(),
      completed: false,
      notes: '',
      date: todayStr()
    }])
    setNewChapter('')
  }
  
  const toggleChapter = (i: number) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, completed: !it.completed } : it))
  }
  
  const updateNotes = (i: number, notes: string) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, notes } : it))
  }
  
  const removeChapter = (i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }
  
  const completedCount = items.filter(i => i.completed).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">تقدم المنهج</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {completedCount}/{items.length} · {progress}%
            </Badge>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">الفصول / الدروس</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new chapter */}
          <div className="flex gap-2">
            <Input
              value={newChapter}
              onChange={e => setNewChapter(e.target.value)}
              placeholder="أضف فصلاً جديداً (مثال: الفصل الأول — الذرة)"
              onKeyDown={e => { if (e.key === 'Enter') addChapter() }}
            />
            <Button onClick={addChapter} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* List */}
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              لم تتم إضافة فصول بعد
            </p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleChapter(i)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 hover:border-primary'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </button>
                  <p className={`flex-1 text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item.chapter}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                  <Button
                    size="sm" variant="ghost"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => removeChapter(i)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  value={item.notes}
                  onChange={e => updateNotes(i, e.target.value)}
                  placeholder="ملاحظات (مثال: تم شرح كامل، تبقى تمارين)"
                  className="text-xs h-8"
                />
              </div>
            ))
          )}
          
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'جاري الحفظ…' : 'حفظ التقدم'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Evaluation tab
// ============================================================
function EvaluationTab({ student, onUpdate }: { student: StudentDetail, onUpdate: () => void }) {
  const [evaluation, setEvaluation] = useState(student.evaluation || '')
  const [saving, setSaving] = useState(false)
  
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/students/${student.id}/curriculum`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation }),
      })
      toast.success('تم حفظ التقييم')
      onUpdate()
    } catch {
      toast.error('فشل الحفظ')
    }
    setSaving(false)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          تقييم أداء الطالب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={evaluation}
          onChange={e => setEvaluation(e.target.value)}
          rows={8}
          placeholder="اكتب تقييمك لأداء الطالب، نقاط القوة والضعف، التوصيات، إلخ…"
        />
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? 'جاري الحفظ…' : 'حفظ التقييم'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Edit student (basic info inline edit)
// ============================================================
function EditStudentSheet({
  student, onClose, onSaved,
}: {
  student: StudentDetail
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(student.name)
  const [phone, setPhone] = useState(student.phone)
  const [notes, setNotes] = useState(student.notes)
  const [status, setStatus] = useState(student.status)
  const [pricePerSession, setPricePerSession] = useState(student.pricePerSession)
  const [billingType, setBillingType] = useState(student.billingType)
  const [billingN, setBillingN] = useState(student.billingN)
  const [saving, setSaving] = useState(false)
  
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, notes, status,
          pricePerSession, billingType, billingN,
        }),
      })
      toast.success('تم الحفظ')
      onSaved()
    } catch {
      toast.error('فشل الحفظ')
    }
    setSaving(false)
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base">تعديل بيانات الطالب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>الاسم</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>الهاتف</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>السعر</Label>
              <Input type="number" value={pricePerSession} onChange={e => setPricePerSession(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="paused">متوقف</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>الفوترة</Label>
              <Select value={billingType} onValueChange={setBillingType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_n">لكل N حصص</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {billingType === 'per_n' && (
              <div className="space-y-1">
                <Label>N</Label>
                <Input type="number" value={billingN} onChange={e => setBillingN(Number(e.target.value))} min={1} />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? 'جاري الحفظ…' : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Report dialog — printable invoice
// ============================================================
function ReportDialog({
  studentId, studentName, onClose,
}: {
  studentId: string
  studentName: string
  onClose: () => void
}) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  
  useEffect(() => {
    fetch(`/api/students/${studentId}/report`)
      .then(r => r.json())
      .then(async (data) => {
        setReport(data)
        setLoading(false)
        // Generate QR code with payment info
        if (data.teacher?.iban) {
          const QRCode = (await import('qrcode')).default
          const qrText = `IBAN:${data.teacher.iban}\nBENEFICIARY:${data.teacher.beneficiaryName || ''}\nAMOUNT:${data.summary.outstandingAmount}\nSTUDENT:${data.student.name}`
          const url = await QRCode.toDataURL(qrText, { width: 240, margin: 1 })
          setQrDataUrl(url)
        }
      })
      .catch(() => setLoading(false))
  }, [studentId])
  
  const handlePrint = () => {
    const printContents = document.getElementById('printable-report')?.innerHTML
    if (!printContents) return
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>تقرير ${studentName}</title>
        <style>
          body { font-family: 'Cairo', 'Tajawal', system-ui, sans-serif; padding: 24px; color: #1a2e2a; }
          .header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #2F6F63; margin-bottom: 16px; }
          .header h1 { color: #2F6F63; margin: 0 0 4px; font-size: 20px; }
          .header p { margin: 0; color: #666; font-size: 12px; }
          .student-card { background: #f5f0e6; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
          .student-card h2 { margin: 0 0 8px; font-size: 16px; }
          .student-card .meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #444; }
          .student-card .meta div { display: flex; gap: 4px; }
          .student-card .meta strong { color: #2F6F63; }
          .outstanding { background: #e8f5e9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; text-align: center; }
          .outstanding p { margin: 0; color: #555; font-size: 12px; }
          .outstanding .amount { font-size: 24px; font-weight: bold; color: #2F6F63; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          th, td { padding: 8px; text-align: right; border-bottom: 1px solid #ddd; }
          th { background: #2F6F63; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .qr-section { background: #f5f0e6; padding: 16px; border-radius: 8px; text-align: center; margin-top: 16px; }
          .qr-section h3 { margin: 0 0 12px; font-size: 14px; color: #2F6F63; }
          .qr-section img { display: block; margin: 0 auto 12px; }
          .qr-section .bank-info { font-size: 11px; color: #444; line-height: 1.7; }
          .footer { display: flex; justify-content: space-between; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 16px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); }, 500)
  }
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="text-center text-white" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-2xl bg-white/20 mx-auto mb-3 animate-pulse" />
          <p className="text-sm">جاري إنشاء التقرير…</p>
        </div>
      </div>
    )
  }
  
  if (!report) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b p-3 flex items-center justify-between z-10">
          <h3 className="font-bold">تقرير الطالب</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" />
              طباعة / حفظ PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </div>
        
        {/* Printable content */}
        <div id="printable-report" className="p-6">
          <div className="header text-center pb-3 border-b-2 border-primary mb-4">
            <h1 className="text-primary font-bold text-xl m-0">تقرير الدفع</h1>
            <p className="text-xs text-muted-foreground m-0">
              {report.student.name} · {SUBJECT_AR[report.student.subject] || report.student.subject} · الصف {report.student.grade}
            </p>
          </div>
          
          {/* Student info card */}
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg mb-4">
            <h2 className="font-bold text-base mb-2">{report.student.name}</h2>
            <div className="flex flex-wrap gap-3 text-xs">
              <div><strong className="text-primary">المادة:</strong> {SUBJECT_AR[report.student.subject] || report.student.subject}</div>
              <div><strong className="text-primary">الصف:</strong> {report.student.grade}</div>
              <div><strong className="text-primary">النظام:</strong> {STREAM_AR[report.student.stream]}</div>
              <div><strong className="text-primary">سعر الحصة:</strong> {formatCurrency(report.student.pricePerSession)}</div>
              {report.student.phone && (
                <div><strong className="text-primary">الهاتف:</strong> <span dir="ltr">{report.student.phone}</span></div>
              )}
            </div>
          </div>
          
          {/* Outstanding amount - BIG HIGHLIGHTED */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800 p-4 rounded-lg mb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">المبلغ المستحق حالياً</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(report.summary.outstandingAmount)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {report.summary.billingProgress}
            </p>
            <p className="text-[10px] text-muted-foreground/80 mt-1">
              ({report.summary.dueSessionsCount} حصة تامة وغير مدفوعة)
            </p>
          </div>
          
          {/* PAID sessions table — الحصص المدفوعة فقط */}
          {report.paidSessions && report.paidSessions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                الحصص المدفوعة ({report.paidSessions.length} حصة)
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-emerald-700 text-white">
                    <th className="p-2 text-right">#</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الوقت</th>
                    <th className="p-2 text-right">الموضوع</th>
                    <th className="p-2 text-right">الدفعة</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.paidSessions].reverse().map((s: any, i: number) => {
                    // Find the payment that covered this session
                    const payGroup = report.sessionsByPayment?.find((g: any) => g.sessions.some((ss: any) => ss.id === s.id))
                    return (
                      <tr key={s.id} className="border-b bg-emerald-50/30 dark:bg-emerald-950/10">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{formatDateAr(s.date)}</td>
                        <td className="p-2">{formatTime12(s.time)}</td>
                        <td className="p-2">{s.topic || '—'}</td>
                        <td className="p-2 text-emerald-700 dark:text-emerald-300">
                          {payGroup?.payment ? `${formatDateAr(payGroup.payment.date)} — ${formatCurrency(payGroup.payment.amount)}` : '✓'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* DUE sessions table — الحصص المستحقة الدفع */}
          {report.dueSessions && report.dueSessions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                الحصص المستحقة الدفع ({report.dueSessions.length} حصة)
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-amber-700 text-white">
                    <th className="p-2 text-right">#</th>
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">الوقت</th>
                    <th className="p-2 text-right">الموضوع</th>
                    <th className="p-2 text-right">سعر الحصة</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.dueSessions].reverse().map((s: any, i: number) => (
                    <tr key={s.id} className="border-b bg-amber-50/30 dark:bg-amber-950/10">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{formatDateAr(s.date)}</td>
                      <td className="p-2">{formatTime12(s.time)}</td>
                      <td className="p-2">{s.topic || '—'}</td>
                      <td className="p-2 font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(report.student.pricePerSession)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-950/30 text-xs">
                <strong>الحساب:</strong> {report.summary.dueSessionsCount} حصة تامة × {formatCurrency(report.student.pricePerSession)} = <strong>{formatCurrency(report.summary.outstandingAmount)}</strong>
              </div>
            </div>
          )}
          
          {/* Past payments summary */}
          {report.payments.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2">سجل الدفعات السابقة</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-2 text-right">التاريخ</th>
                    <th className="p-2 text-right">المبلغ</th>
                    <th className="p-2 text-right">عدد الجلسات</th>
                    <th className="p-2 text-right">النوع</th>
                  </tr>
                </thead>
                <tbody>
                  {report.payments.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{formatDateAr(p.date)}</td>
                      <td className="p-2 font-bold">{formatCurrency(p.amount)}</td>
                      <td className="p-2">{p.sessionCount}</td>
                      <td className="p-2">{PAYMENT_TYPE_AR[p.type] || p.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* QR code section */}
          {report.teacher?.iban && qrDataUrl && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg text-center">
              <h3 className="font-bold text-sm mb-2 text-primary">امسح الرمز للدفع</h3>
              <img src={qrDataUrl} alt="QR Code" className="mx-auto mb-2 w-48 h-48" />
              <div className="text-xs space-y-1 text-right max-w-xs mx-auto">
                {report.teacher.beneficiaryName && (
                  <div><strong>المستفيد:</strong> {report.teacher.beneficiaryName}</div>
                )}
                <div><strong>الآيبان:</strong> <span dir="ltr">{report.teacher.iban}</span></div>
                {report.teacher.bankName && (
                  <div><strong>البنك:</strong> {report.teacher.bankName}</div>
                )}
                {report.teacher.bankAccount && (
                  <div><strong>رقم الحساب:</strong> <span dir="ltr">{report.teacher.bankAccount}</span></div>
                )}
              </div>
            </div>
          )}
          
          {!report.teacher?.iban && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-center text-xs text-muted-foreground">
              💡 أضف بيانات الآيبان من الإعدادات لعرض QR code للدفع في التقرير
            </div>
          )}
          
          {/* Summary - 4 cells instead of 2 */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-muted-foreground">إجمالي المدفوع</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(report.summary.totalPaid)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ({report.summary.paidSessionsCount} حصة مدفوعة)
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <p className="text-muted-foreground">المستحق حالياً</p>
              <p className="font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(report.summary.outstandingAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ({report.summary.dueSessionsCount} حصة مستحقة)
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40">
              <p className="text-muted-foreground">إجمالي الجلسات التامة</p>
              <p className="font-bold">{report.summary.completedSessions} جلسة</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40">
              <p className="text-muted-foreground">عدد الدفعات</p>
              <p className="font-bold">{report.summary.totalPayments} دفعة</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between text-[10px] text-muted-foreground border-t mt-4 pt-2">
            <span>تاريخ الطباعة: {todayStr()}</span>
            <span>Solafios Tracker — تقرير الدفع</span>
          </div>
        </div>
      </div>
    </div>
  )
}
