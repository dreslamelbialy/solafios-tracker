'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  CalendarOff, Plus, Pencil, Trash2, CalendarDays, CalendarClock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  HOLIDAY_KINDS, HOLIDAY_KIND_AR, STREAMS, STREAM_AR,
  formatDateAr, todayStr,
} from '@/lib/solafios'

interface Holiday {
  id: string
  title: string
  kind: string
  stream: string
  startDate: string
  endDate: string
}

export function HolidaysView() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterStream, setFilterStream] = useState('all')
  const [filterKind, setFilterKind] = useState('all')
  
  const load = () => {
    setLoading(true)
    fetch('/api/holidays')
      .then(r => r.json())
      .then(d => { setHolidays(d); setLoading(false) })
  }
  
  useEffect(() => { load() }, [])
  
  const filtered = useMemo(() => {
    return holidays
      .filter(h => {
        if (filterStream !== 'all' && h.stream !== filterStream && h.stream !== 'all') return false
        if (filterKind !== 'all' && h.kind !== filterKind) return false
        return true
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [holidays, filterStream, filterKind])
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await fetch(`/api/holidays/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم التحديث')
      } else {
        await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تمت الإضافة')
      }
      setSheetOpen(false)
      load()
    } catch {
      toast.error('فشل الحفظ')
    }
  }
  
  const handleDelete = async (h: Holiday) => {
    if (!confirm(`حذف "${h.title}"؟`)) return
    try {
      await fetch(`/api/holidays/${h.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      load()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  const upcoming = filtered.filter(h => h.endDate >= todayStr())
  const past = filtered.filter(h => h.endDate < todayStr())
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الإجازات والأحداث</h2>
          <p className="text-sm text-muted-foreground">{holidays.length} سجل</p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-2">
          <Select value={filterStream} onValueChange={setFilterStream}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="النظام" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنظمة</SelectItem>
              {STREAMS.map(s => <SelectItem key={s} value={s}>{STREAM_AR[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {HOLIDAY_KINDS.map(k => <SelectItem key={k} value={k}>{HOLIDAY_KIND_AR[k]}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                القادمة ({upcoming.length})
              </h3>
              <div className="space-y-2">
                {upcoming.map(h => <HolidayRow key={h.id} h={h} onEdit={() => { setEditing(h); setSheetOpen(true) }} onDelete={() => handleDelete(h)} />)}
              </div>
            </div>
          )}
          
          {past.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 mt-4 text-muted-foreground">
                السابقة ({past.length})
              </h3>
              <div className="space-y-2">
                {past.slice(-20).reverse().map(h => <HolidayRow key={h.id} h={h} onEdit={() => { setEditing(h); setSheetOpen(true) }} onDelete={() => handleDelete(h)} />)}
              </div>
            </div>
          )}
          
          {filtered.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">لا توجد إجازات مسجلة</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{editing ? 'تعديل' : 'إضافة إجازة/حدث'}</SheetTitle>
          </SheetHeader>
          <HolidayForm holiday={editing} onSave={handleSave} onCancel={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function HolidayRow({ h, onEdit, onDelete }: { h: Holiday, onEdit: () => void, onDelete: () => void }) {
  const Icon = h.kind === 'event' ? CalendarClock : CalendarOff
  const isRange = h.startDate !== h.endDate
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            h.kind === 'event' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : h.kind === 'exam' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{h.title}</h3>
              <Badge variant="outline" className="text-[10px]">{HOLIDAY_KIND_AR[h.kind]}</Badge>
              <Badge variant="outline" className="text-[10px]">{STREAM_AR[h.stream]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRange
                ? `${formatDateAr(h.startDate)} → ${formatDateAr(h.endDate)}`
                : formatDateAr(h.startDate)
              }
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HolidayForm({
  holiday, onSave, onCancel,
}: {
  holiday: Holiday | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(holiday?.title || '')
  const [kind, setKind] = useState(holiday?.kind || 'holiday')
  const [stream, setStream] = useState(holiday?.stream || 'ministry')
  const [startDate, setStartDate] = useState(holiday?.startDate || todayStr())
  const [endDate, setEndDate] = useState(holiday?.endDate || todayStr())
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label>العنوان *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: عيد الفطر" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>النوع</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOLIDAY_KINDS.map(k => <SelectItem key={k} value={k}>{HOLIDAY_KIND_AR[k]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>النظام</Label>
          <Select value={stream} onValueChange={setStream}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STREAMS.map(s => <SelectItem key={s} value={s}>{STREAM_AR[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>من تاريخ</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>إلى تاريخ</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ title, kind, stream, startDate, endDate })} className="flex-1">
          حفظ
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}
