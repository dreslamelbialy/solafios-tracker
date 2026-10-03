'use client'

import { useEffect, useState } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, CalendarCheck, Wallet, TrendingUp,
  CalendarDays, AlertTriangle, ChevronLeft,
  Sparkles, CalendarOff, Navigation,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  formatCurrency, formatNumber, formatDateAr, formatTime12,
  SESSION_STATUS_AR, SESSION_STATUS_COLORS, SUBJECT_AR, STREAM_AR,
  todayStr,
} from '@/lib/solafios'
import { ViewKey } from '@/lib/use-view'

interface Stats {
  today: string
  counts: {
    totalStudents: number
    activeStudents: number
    sessionsToday: number
    sessionsThisWeek: number
    sessionsThisMonth: number
    paymentsThisMonth: number
    paymentsThisYear: number
    cancelledByTeacherThisMonth: number
  }
  revenue: { thisMonth: number; thisYear: number }
  upcoming: any[]
  byStatus: { status: string; _count: number }[]
  bySubject: { subject: string; _count: number }[]
  monthlyTrend: { month: string; revenue: number; count: number }[]
  topStudents: { name: string; subject: string; total: number; count: number }[]
  unbilled: any[]
}

const PIE_COLORS = ['#2F6F63', '#D97706', '#DC2626', '#2563EB', '#7C3AED', '#059669']

export function DashboardView({ setView }: { setView: (v: ViewKey) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        </div>
      </div>
    )
  }
  
  const todayLabel = formatDateAr(stats.today)
  
  return (
    <div className="space-y-6">
      {/* Greeting + date */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">أهلاً بك في سولافيوس 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">{todayLabel}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView('sessions')}
          className="gap-2"
        >
          <CalendarCheck className="w-4 h-4" />
          جدول اليوم
        </Button>
      </div>
      
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="الطلاب النشطون"
          value={formatNumber(stats.counts.activeStudents)}
          sub={`من ${formatNumber(stats.counts.totalStudents)} إجمالاً`}
          color="text-emerald-600"
          onClick={() => setView('students')}
        />
        <KpiCard
          icon={CalendarCheck}
          label="جلسات اليوم"
          value={formatNumber(stats.counts.sessionsToday)}
          sub={`${formatNumber(stats.counts.sessionsThisWeek)} هذا الأسبوع`}
          color="text-blue-600"
          onClick={() => setView('sessions')}
        />
        <KpiCard
          icon={Wallet}
          label="دخل هذا الشهر"
          value={formatCurrency(stats.revenue.thisMonth)}
          sub={`${formatNumber(stats.counts.paymentsThisMonth)} دفعة`}
          color="text-amber-600"
          onClick={() => setView('payments')}
        />
        <KpiCard
          icon={TrendingUp}
          label="دخل هذه السنة"
          value={formatCurrency(stats.revenue.thisYear)}
          sub={`${formatNumber(stats.counts.paymentsThisYear)} دفعة`}
          color="text-primary"
          onClick={() => setView('payments')}
        />
      </div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">الإيرادات الشهرية</CardTitle>
            <CardDescription>آخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'الإيراد']}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Students by subject (1 col) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الطلاب حسب المادة</CardTitle>
            <CardDescription>توزيع الطلاب النشطين</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.bySubject.map(s => ({
                      name: SUBJECT_AR[s.subject] || s.subject,
                      value: s._count,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {stats.bySubject.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming + Unbilled */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming sessions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                الجلسات القادمة
              </CardTitle>
              <CardDescription>أسبوعياً</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('sessions')} className="gap-1 text-xs">
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[340px] overflow-y-auto scroll-area-thin">
            {stats.upcoming.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                لا توجد جلسات قادمة هذا الأسبوع
              </div>
            ) : (
              stats.upcoming.map(s => {
                const isToday = s.date === todayStr()
                const hasLocation = s.student.locationRec && (s.student.locationRec.lat || s.student.locationRec.lng)
                const mapsUrl = hasLocation
                  ? `https://www.google.com/maps/dir/?api=1&destination=${s.student.locationRec.lat},${s.student.locationRec.lng}`
                  : s.student.locationRec?.name
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.student.locationRec.name)}`
                    : null
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                      isToday
                        ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      <span className="text-[10px] font-medium leading-none">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short' })}
                      </span>
                      <span className="text-base font-bold leading-none mt-0.5">
                        {new Date(s.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-sm truncate">{s.student.name}</p>
                        {isToday && (
                          <Badge variant="outline" className="text-[9px] bg-primary text-primary-foreground border-0">
                            اليوم
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatTime12(s.time)} · {SUBJECT_AR[s.student.subject] || s.student.subject}
                        {s.student.locationRec && ` · ${s.student.locationRec.name}`}
                      </p>
                    </div>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                          isToday
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}
                        title="اذهب إلى الموقع على Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        اذهب للموقع
                      </a>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
        
        {/* Unbilled sessions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                جلسات غير مفوترة
              </CardTitle>
              <CardDescription>جلسات تمت ولم تُفوتر بعد</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('payments')} className="gap-1 text-xs">
              عرض المدفوعات
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[340px] overflow-y-auto scroll-area-thin">
            {stats.unbilled.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                كل الجلسات مفوترة! 🎉
              </div>
            ) : (
              stats.unbilled.slice(0, 8).map(u => (
                <div
                  key={u.studentId}
                  className="flex items-center gap-3 p-2.5 rounded-lg border bg-amber-50/40 dark:bg-amber-950/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
                    {u.count}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.count} جلسة · {SUBJECT_AR[u.subject] || u.subject}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-300">{formatCurrency(u.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">مستحق</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Top students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            أعلى الطلاب بالدفعات (هذه السنة)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد دفعات هذا العام</p>
          ) : (
            <div className="space-y-2">
              {stats.topStudents.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : i === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.count} دفعة · {SUBJECT_AR[s.subject] || s.subject}
                    </p>
                  </div>
                  <p className="font-bold text-sm">{formatCurrency(s.total)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, sub, color, onClick,
}: {
  icon: any
  label: string
  value: string
  sub?: string
  color?: string
  onClick?: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className={`w-4 h-4 ${color || 'text-muted-foreground'}`} />
        </div>
        <p className="text-xl font-bold tabular leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
