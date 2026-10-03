'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Download, Upload, Database, Beaker, Sun, Moon, Palette,
  Info, AlertTriangle, Wallet, Sparkles, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

export function SettingsView() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const { theme, setTheme } = useTheme()
  
  // Teacher profile state
  const [teacher, setTeacher] = useState<any>(null)
  const [iban, setIban] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [savingTeacher, setSavingTeacher] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => {
      setTeacher(d)
      setIban(d?.iban || '')
      setBankAccount(d?.bankAccount || '')
      setBankName(d?.bankName || '')
      setBeneficiaryName(d?.beneficiaryName || '')
    })
  }, [])
  
  const handleExport = () => {
    window.location.href = '/api/backup/export'
    toast.success('جاري تنزيل النسخة الاحتياطية…')
  }
  
  const handleImportClick = () => fileRef.current?.click()
  
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!confirm('استيراد البيانات سيحل محل البيانات الحالية (لنفس المعرفات). متابعة؟')) {
      e.target.value = ''
      return
    }
    
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const result = await res.json()
      toast.success(`تم الاستيراد: ${result.students} طالب، ${result.sessions} جلسة، ${result.payments} دفعة`)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      toast.error('فشل الاستيراد: ' + (e instanceof Error ? e.message : 'خطأ'))
    }
    setImporting(false)
    e.target.value = ''
  }
  
  const saveTeacher = async () => {
    setSavingTeacher(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iban, bankAccount, bankName, beneficiaryName }),
      })
      if (!res.ok) throw new Error('فشل الحفظ')
      toast.success('تم حفظ بيانات المدرس')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطأ')
    }
    setSavingTeacher(false)
  }
  
  const generateYearSessions = async () => {
    if (!confirm('سيتم توليد كل الجلسات من اليوم حتى نهاية السنة الدراسية، مع استثناء الإجازات. متابعة؟')) return
    setGenerating(true)
    try {
      const res = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.created > 0) {
        toast.success(`تم إنشاء ${data.created} جلسة جديدة حتى ${data.untilDate}`)
      } else {
        toast.info('لا توجد جلسات جديدة — كل الجلسات موجودة بالفعل')
      }
    } catch {
      toast.error('فشل التوليد')
    }
    setGenerating(false)
  }
  
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <p className="text-sm text-muted-foreground">النسخ الاحتياطي، بيانات الدفع، والمظهر</p>
      </div>
      
      {/* Generate sessions for full year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            توليد الجلسات للسنة الدراسية
          </CardTitle>
          <CardDescription>
            إنشاء كل الجلسات القادمة من اليوم حتى نهاية السنة الدراسية، مع استثناء الإجازات تلقائياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateYearSessions} disabled={generating} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {generating ? 'جاري التوليد…' : 'توليد الجلسات'}
          </Button>
          <p className="text-[11px] text-muted-foreground mt-2">
            التوليد بيتخطى الإجازات المسجلة تلقائياً. لو محتاج جلسة في إجازة، أضفها يدوياً من صفحة الجلسات.
          </p>
        </CardContent>
      </Card>
      
      {/* Bank info (for invoices / QR code) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            بيانات الدفع
          </CardTitle>
          <CardDescription>
            تظهر في تقارير الطلاب و QR code للدفع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>اسم المستفيد</Label>
              <Input value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="مثال: RJHISARI" />
            </div>
            <div className="space-y-1.5">
              <Label>اسم البنك</Label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="مثال: الراجحي" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الآيبان (IBAN)</Label>
              <Input value={iban} onChange={e => setIban(e.target.value)} dir="ltr" placeholder="SA00 0000 0000 0000 0000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الحساب</Label>
              <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} dir="ltr" placeholder="0000000000" />
            </div>
          </div>
          <Button onClick={saveTeacher} disabled={savingTeacher} className="gap-2">
            {savingTeacher ? 'جاري الحفظ…' : 'حفظ بيانات الدفع'}
          </Button>
          {!iban && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-200">
              💡 أضف رقم الآيبان لعرض QR code للدفع في تقارير الطلاب
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            النسخ الاحتياطي
          </CardTitle>
          <CardDescription>
            صدّر بياناتك إلى ملف JSON أو استوردها من ملف سابق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير نسخة احتياطية
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="gap-2" disabled={importing}>
              <Upload className="w-4 h-4" />
              {importing ? 'جاري الاستيراد…' : 'استيراد نسخة'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-bold mb-1">تنبيه</p>
                <p>الاستيراد سيُحدّث البيانات الحالية بنفس المعرفات (upsert). لا يتم الحذف، لكن أي تعديلات يدوية ستُستبدل بقيم النسخة المستوردة.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            المظهر
          </CardTitle>
          <CardDescription>الوضع الفاتح / الداكن / تلقائي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-2"
            >
              <Sun className="w-4 h-4" />
              فاتح
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-2"
            >
              <Moon className="w-4 h-4" />
              داكن
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-2"
            >
              <Palette className="w-4 h-4" />
              تلقائي
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            عن التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الاسم</span>
            <span className="font-medium">سولافيوس تراكر</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الإصدار</span>
            <Badge variant="outline">2.1.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">المكدس التقني</span>
            <span className="font-medium">Next.js 16 · Prisma · SQLite</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">قاعدة البيانات</span>
            <span className="font-medium">SQLite (محلي)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">اللغة</span>
            <span className="font-medium">العربية (RTL)</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Beaker className="w-4 h-4 text-primary" />
            معلومات الداتا
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>كل البيانات مخزنة محلياً في قاعدة بيانات SQLite. يمكنك تصديرها كنسخة احتياطية في أي وقت، ونقلها لجهاز آخر عبر الاستيراد.</p>
        </CardContent>
      </Card>
    </div>
  )
}

