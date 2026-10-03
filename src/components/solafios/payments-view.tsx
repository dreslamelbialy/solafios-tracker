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
  Plus, Wallet, Search, Pencil, Trash2, Link2, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PAYMENT_TYPES, PAYMENT_TYPE_AR,
  formatCurrency, formatDateAr, todayStr,
} from '@/lib/solafios'

interface Payment {
  id: string
  studentId: string
  amount: number
  type: string
  date: string
  notes: string | null
  sessionIds: string
  sessionCount: number
  isHistorical: boolean
  student: { id: string; name: string; subject: string; grade: string; phone: string }
  sessions?: { id: string; date: string; time: string; status: string }[]
}

interface Student {
  id: string
  name: string
  subject: string
  grade: string
  pricePerSession: number
  billingType: string
  billingN: number
}

export function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStudent, setFilterStudent] = useState('all')
  
  const [editing, setEditing] = useState<Payment | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const load = () => {
    setLoading(true)
    fetch('/api/payments')
      .then(r => r.json())
      .then(d => { setPayments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => {
    load()
    fetch('/api/students').then(r => r.json()).then(setStudents)
  }, [])
  
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.student.name.toLowerCase().includes(q)) return false
      }
      if (filterStudent !== 'all' && p.studentId !== filterStudent) return false
      return true
    })
  }, [payments, search, filterStudent])
  
  const total = filtered.reduce((sum, p) => sum + (p.amount || 0), 0)
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await fetch(`/api/payments/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم تحديث الدفعة')
      } else {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم تسجيل الدفعة')
      }
      setSheetOpen(false)
      load()
    } catch {
      toast.error('فشل الحفظ')
    }
  }
  
  const handleDelete = async (p: Payment) => {
    if (!confirm('حذف هذه الدفعة؟ سيتم فك ربط الجلسات المرتبطة بها.')) return
    try {
      await fetch(`/api/payments/${p.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      load()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">المدفوعات</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} دفعة · الإجمالي: {formatCurrency(total)}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          تسجيل دفعة
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الطالب…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="الطالب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطلاب</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد دفعات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PaymentRow
              key={p.id}
              payment={p}
              onEdit={() => { setEditing(p); setSheetOpen(true) }}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}
      
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle>{editing ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}</SheetTitle>
          </SheetHeader>
          <PaymentForm
            payment={editing}
            students={students}
            onSave={handleSave}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PaymentRow({
  payment, onEdit, onDelete,
}: {
  payment: Payment
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{payment.student.name}</h3>
              <Badge variant="outline" className="text-[10px]">
                {PAYMENT_TYPE_AR[payment.type] || payment.type}
              </Badge>
              {payment.isHistorical && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-0">
                  تاريخية
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateAr(payment.date)}
              {payment.sessionCount > 0 && ` · ${payment.sessionCount} جلسة`}
            </p>
            {payment.notes && (
              <p className="text-xs mt-1 text-muted-foreground line-clamp-1">{payment.notes}</p>
            )}
            {payment.sessions && payment.sessions.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Link2 className="w-3 h-3" />
                <span>مرتبطة بجلسات: {payment.sessions.map(s => s.date).join('، ')}</span>
              </div>
            )}
          </div>
          
          <div className="text-left flex-shrink-0">
            <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(payment.amount)}</p>
            <div className="flex gap-1 justify-end mt-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onEdit}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentForm({
  payment, students, onSave, onCancel,
}: {
  payment: Payment | null
  students: Student[]
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [studentId, setStudentId] = useState(payment?.studentId || '')
  const [amount, setAmount] = useState(payment?.amount || 0)
  const [type, setType] = useState(payment?.type || 'full')
  const [date, setDate] = useState(payment?.date || todayStr())
  const [notes, setNotes] = useState(payment?.notes || '')
  
  // Find student's unbilled sessions to link
  const [unbilledSessions, setUnbilledSessions] = useState<any[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>(
    payment ? JSON.parse(payment.sessionIds || '[]') : []
  )
  
  useEffect(() => {
    if (!studentId) {
      setUnbilledSessions([])
      return
    }
    fetch(`/api/sessions?studentId=${studentId}&status=completed&limit=200`)
      .then(r => r.json())
      .then(data => {
        setUnbilledSessions(data.filter((s: any) => !s.billed))
      })
  }, [studentId])
  
  // Auto-calc amount from selected sessions
  useEffect(() => {
    if (selectedSessions.length === 0) return
    const student = students.find(s => s.id === studentId)
    if (!student) return
    const calc = selectedSessions.length * student.pricePerSession
    setAmount(calc)
  }, [selectedSessions, studentId, students])
  
  const toggleSession = (id: string) => {
    setSelectedSessions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  
  const submit = () => {
    if (!studentId) {
      toast.error('اختر الطالب')
      return
    }
    if (amount <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر')
      return
    }
    onSave({
      studentId,
      amount: Number(amount),
      type,
      date,
      notes,
      sessionIds: selectedSessions,
    })
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label>الطالب *</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
          <SelectContent>
            {students.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {s.subject} ({s.grade})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>المبلغ</Label>
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            min={0}
          />
        </div>
        <div className="space-y-1.5">
          <Label>النوع</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{PAYMENT_TYPE_AR[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label>التاريخ</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      
      {/* Link sessions */}
      {studentId && (
        <div className="space-y-1.5">
          <Label>الجلسات المرتبطة (تمت وغير مفوترة)</Label>
          {unbilledSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
              لا توجد جلسات تامة غير مفوترة لهذا الطالب
            </p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto scroll-area-thin border rounded-lg p-2">
              {unbilledSessions.map(s => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(s.id)}
                    onChange={() => toggleSession(s.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{formatDateAr(s.date)}</span>
                    <span className="text-xs text-muted-foreground mr-2">{s.time}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedSessions.length > 0 && (
            <p className="text-xs text-muted-foreground">
              تم اختيار {selectedSessions.length} جلسة — المبلغ المحسوب: {formatCurrency(amount)}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-1.5">
        <Label>ملاحظات</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>
      
      <div className="flex gap-2 sticky bottom-0 bg-background pt-2 pb-1 border-t">
        <Button onClick={submit} className="flex-1">
          {payment ? 'حفظ' : 'تسجيل'}
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}
