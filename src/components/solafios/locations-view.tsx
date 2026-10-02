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
  MapPin, Plus, Pencil, Trash2, Navigation,
} from 'lucide-react'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  _count?: { students: number }
}

export function LocationsView() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Location | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const load = () => {
    setLoading(true)
    fetch('/api/locations')
      .then(r => r.json())
      .then(d => { setLocations(d); setLoading(false) })
  }
  
  useEffect(() => { load() }, [])
  
  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await fetch(`/api/locations/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast.success('تم التحديث')
      } else {
        await fetch('/api/locations', {
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
  
  const handleDelete = async (l: Location) => {
    if (!confirm(`حذف مكان "${l.name}"؟`)) return
    try {
      await fetch(`/api/locations/${l.id}`, { method: 'DELETE' })
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
          <h2 className="text-2xl font-bold">الأماكن</h2>
          <p className="text-sm text-muted-foreground">{locations.length} مكان</p>
        </div>
        <Button onClick={() => { setEditing(null); setSheetOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مكان
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل…</div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد أماكن مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map(l => (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{l.name}</h3>
                      {l.address && <p className="text-xs text-muted-foreground truncate">{l.address}</p>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {l._count?.students || 0} طالب
                  </Badge>
                </div>
                
                {l.lat && l.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${l.lat},${l.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Navigation className="w-3 h-3" />
                    عرض على الخريطة
                  </a>
                )}
                
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(l); setSheetOpen(true) }} className="flex-1 gap-1">
                    <Pencil className="w-3 h-3" />
                    تعديل
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(l)} className="text-destructive">
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
            <SheetTitle>{editing ? 'تعديل مكان' : 'إضافة مكان'}</SheetTitle>
          </SheetHeader>
          <LocationForm location={editing} onSave={handleSave} onCancel={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function LocationForm({
  location, onSave, onCancel,
}: {
  location: Location | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(location?.name || '')
  const [address, setAddress] = useState(location?.address || '')
  const [lat, setLat] = useState(location?.lat?.toString() || '')
  const [lng, setLng] = useState(location?.lng?.toString() || '')
  
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('الموقع غير مدعوم في هذا المتصفح')
      return
    }
    toast.info('جاري الحصول على موقعك…')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toString())
        setLng(pos.coords.longitude.toString())
        toast.success('تم الحصول على الموقع')
      },
      err => toast.error('فشل الحصول على الموقع: ' + err.message),
      { enableHighAccuracy: true }
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label>الاسم *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: منزل أحمد" />
      </div>
      <div className="space-y-1.5">
        <Label>العنوان</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="الحي، الشارع" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>خط العرض</Label>
          <Input value={lat} onChange={e => setLat(e.target.value)} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label>خط الطول</Label>
          <Input value={lng} onChange={e => setLng(e.target.value)} dir="ltr" />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={useMyLocation} className="gap-2 w-full">
        <Navigation className="w-4 h-4" />
        استخدم موقعي الحالي
      </Button>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ name, address, lat, lng })} className="flex-1">
          حفظ
        </Button>
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </div>
  )
}
