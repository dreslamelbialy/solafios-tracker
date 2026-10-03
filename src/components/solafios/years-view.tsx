'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  GraduationCap, Plus, Pencil, Trash2, Archive,
} from 'lucide-react'
import { toast } from 'sonner'

interface Year {
  id: string
  label: string
  startDate: string
  endDate: string
  archived: boolean
  _count?: { students: number }
}

export function YearsView() {
  const [years, setYears] = useState<Year[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Year | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const load = () => {
    setLoading(true)
    fetch('/api/years')
      .then(r => r.json())
      .then(d => { setYears(d); setLoading(false) })
  }
  
  useEffect(() => { load() }, [])
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await fetch(`/api/years/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم التحديث')
      } else {
        await fetch('/api/years', {
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
  
  const handleDelete = async (y: Year) => {
    if (!confirm(`حذف السنة ${y.label}؟`)) return
    try {
      await fetch(`/api/years/${y.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      load()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  const toggleArchive = async (y: Year) => {
    try {
      await fetch(`/api/years/${y.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !y.archived }),
      })
      toast.success(y.archived ? 'تم الاسترجاع' : 'تمت الأرشفة')
      load()
    } catch {
      toast.error('فشل')
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">السنوات الدراسية</h2>
          <p className="text-sm text-muted-foreground">{years.length} سنة</p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة سنة
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : years.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد سنوات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {years.map(y => (
            <Card key={y.id} className={y.archived ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{y.label}</h3>
                      <p className="text-xs text-muted-foreground">{y.startDate} → {y.endDate}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {y._count?.students || 0} طالب
                  </Badge>
                </div>
                
                {y.archived && (
                  <Badge variant="outline" className="text-[10px] bg-muted">مؤرشفة</Badge>
                )}
                
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(y); setSheetOpen(true) }} className="flex-1 gap-1">
                    <Pencil className="w-3 h-3" />
                    تعديل
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleArchive(y)} title={y.archived ? 'استرجاع' : 'أرشفة'}>
                    <Archive className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(y)} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{editing ? 'تعديل سنة' : 'إضافة سنة دراسية'}</SheetTitle>
          </SheetHeader>
          <YearForm year={editing} onSave={handleSave} onCancel={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function YearForm({
  year, onSave, onCancel,
}: {
  year: Year | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(year?.label || '')
  const [startDate, setStartDate] = useState(year?.startDate || '')
  const [endDate, setEndDate] = useState(year?.endDate || '')
  const [archived, setArchived] = useState(year?.archived || false)
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label>العنوان *</Label>
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="مثال: 2026-2027" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>تاريخ البداية</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>تاريخ النهاية</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="archived"
          checked={archived}
          onChange={e => setArchived(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="archived" className="text-sm font-normal cursor-pointer">
          مؤرشفة
        </Label>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ label, startDate, endDate, archived })} className="flex-1">
          حفظ
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}
