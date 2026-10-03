'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Users2, Plus, Pencil, Trash2, Phone, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/solafios'

interface Family {
  id: string
  primaryName: string
  primaryPhone: string | null
  siblingDiscount: number
  notes: string | null
  _count?: { students: number }
  students?: { id: string; name: string }[]
}

export function FamiliesView() {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Family | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const load = () => {
    setLoading(true)
    fetch('/api/families')
      .then(r => r.json())
      .then(d => { setFamilies(d); setLoading(false) })
  }
  
  useEffect(() => { load() }, [])
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await fetch(`/api/families/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم التحديث')
      } else {
        await fetch('/api/families', {
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
  
  const handleDelete = async (f: Family) => {
    if (!confirm(`حذف عائلة ${f.primaryName}؟ سيتم فصل الطلاب المرتبطين.`)) return
    try {
      await fetch(`/api/families/${f.id}`, { method: 'DELETE' })
      toast.success('تم الحذف')
      load()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">العائلات</h2>
          <p className="text-sm text-muted-foreground">{families.length} عائلة</p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة عائلة
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد عائلات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {families.map(f => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{f.primaryName}</h3>
                      {f.primaryPhone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3" />
                          {f.primaryPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    <Users className="w-3 h-3 ml-1" />
                    {f._count?.students || 0}
                  </Badge>
                </div>
                
                {f.siblingDiscount > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    خصم الإخوة: {formatCurrency(f.siblingDiscount)}
                  </p>
                )}
                
                {f.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{f.notes}</p>
                )}
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(f); setSheetOpen(true) }} className="flex-1 gap-1">
                    <Pencil className="w-3 h-3" />
                    تعديل
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(f)} className="text-destructive">
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
            <SheetTitle>{editing ? 'تعديل عائلة' : 'إضافة عائلة'}</SheetTitle>
          </SheetHeader>
          <FamilyForm family={editing} onSave={handleSave} onCancel={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FamilyForm({
  family, onSave, onCancel,
}: {
  family: Family | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [primaryName, setPrimaryName] = useState(family?.primaryName || '')
  const [primaryPhone, setPrimaryPhone] = useState(family?.primaryPhone || '')
  const [siblingDiscount, setSiblingDiscount] = useState(family?.siblingDiscount || 0)
  const [notes, setNotes] = useState(family?.notes || '')
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label>اسم ولي الأمر *</Label>
        <Input value={primaryName} onChange={e => setPrimaryName(e.target.value)} placeholder="مثال: د. مروة السويغي" />
      </div>
      <div className="space-y-1.5">
        <Label>الهاتف</Label>
        <Input value={primaryPhone} onChange={e => setPrimaryPhone(e.target.value)} dir="ltr" placeholder="+966…" />
      </div>
      <div className="space-y-1.5">
        <Label>خصم الإخوة (ريال)</Label>
        <Input
          type="number"
          value={siblingDiscount}
          onChange={e => setSiblingDiscount(Number(e.target.value))}
          min={0}
        />
        <p className="text-[11px] text-muted-foreground">
          خصم يُطبق على كل طالب من الإخوة في العائلة
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>ملاحظات</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ primaryName, primaryPhone, siblingDiscount, notes })} className="flex-1">
          حفظ
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}
