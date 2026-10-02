'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Download, Upload, Database, Beaker, Sun, Moon, Palette,
  Github, Info, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

export function SettingsView() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const { theme, setTheme } = useTheme()
  
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
      if (result.errors?.length > 0) {
        console.warn('Import errors:', result.errors)
        toast.warning(`${result.errors.length} أخطاء — راجع الكونسول`)
      }
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      toast.error('فشل الاستيراد: ' + (e instanceof Error ? e.message : 'خطأ'))
    }
    setImporting(false)
    e.target.value = ''
  }
  
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <p className="text-sm text-muted-foreground">النسخ الاحتياطي، المظهر، ومعلومات التطبيق</p>
      </div>
      
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
            <Badge variant="outline">2.0.0</Badge>
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
