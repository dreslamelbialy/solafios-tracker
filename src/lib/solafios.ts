// Solafios Tracker — shared helpers and constants

// الليوم العربي/الإنجليزي
export const WEEKDAYS_AR = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
]
export const WEEKDAYS_AR_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// الفلاتر الافتراضية للحالة
export const SESSION_STATUSES = [
  'scheduled', 'completed', 'cancelled', 'cancelled_by_teacher',
  'cancelled_by_student', 'no_show'
] as const
export type SessionStatus = typeof SESSION_STATUSES[number]

export const SESSION_STATUS_AR: Record<string, string> = {
  scheduled: 'مجدولة',
  completed: 'تمت',
  cancelled: 'ملغاة',
  cancelled_by_teacher: 'ألغيت من المدرس',
  cancelled_by_student: 'ألغيت من الطالب',
  no_show: 'لم يحضر',
}

export const SESSION_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  cancelled_by_teacher: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled_by_student: 'bg-orange-100 text-orange-700 border-orange-200',
  no_show: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const STUDENT_STATUSES = ['active', 'paused', 'archived'] as const
export const STUDENT_STATUS_AR: Record<string, string> = {
  active: 'نشط',
  paused: 'متوقف',
  archived: 'مؤرشف',
}

export const STREAMS = ['international', 'national', 'ministry', 'all'] as const
export const STREAM_AR: Record<string, string> = {
  international: 'دولي',
  national: 'وطني',
  ministry: 'وزاري',
  all: 'الكل',
}

export const SUBJECTS = ['Chemistry', 'Science', 'chemistry'] as const
export const SUBJECT_AR: Record<string, string> = {
  Chemistry: 'كيمياء',
  chemistry: 'كيمياء',
  Science: 'علوم',
}

export const BILLING_TYPES = ['per_n', 'monthly'] as const
export const BILLING_TYPE_AR: Record<string, string> = {
  per_n: 'لكل N حصص',
  monthly: 'شهري',
}

export const PAYMENT_TYPES = ['full', 'partial', 'advance'] as const
export const PAYMENT_TYPE_AR: Record<string, string> = {
  full: 'كامل',
  partial: 'جزئي',
  advance: 'مقدم',
}

export const HOLIDAY_KINDS = ['holiday', 'event', 'exam'] as const
export const HOLIDAY_KIND_AR: Record<string, string> = {
  holiday: 'إجازة',
  event: 'حدث',
  exam: 'امتحان',
}

// ===== Date helpers =====
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateAr(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ar-SA-u-ca-gregory', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ar-SA-u-ca-gregory', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatTime12(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h)) return timeStr
  const period = h < 12 ? 'ص' : 'م'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-SA').format(n || 0)
}

// Get today's weekday (0=Sun .. 6=Sat)
export function todayWeekday(): number {
  return new Date().getDay()
}

// Parse JSON safely
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Check if a date falls in a holiday range
export function isDateInHoliday(dateStr: string, holidays: { startDate: string; endDate: string }[]): boolean {
  return holidays.some(h => dateStr >= h.startDate && dateStr <= h.endDate)
}

// Generate sessions for the next N weeks based on weekly schedule
export function generateUpcomingDates(
  weeklySchedule: { day: number; time: string }[],
  weeksAhead: number = 4,
  startDate: Date = new Date(),
  excludeDates: Set<string> = new Set()
): { date: string; time: string }[] {
  const result: { date: string; time: string }[] = []
  const today = new Date(startDate)
  today.setHours(0, 0, 0, 0)
  
  for (let week = 0; week < weeksAhead; week++) {
    for (const sched of weeklySchedule) {
      const d = new Date(today)
      const currentDay = d.getDay()
      const diff = (sched.day - currentDay + 7) % 7
      d.setDate(d.getDate() + diff + week * 7)
      const dateStr = d.toISOString().slice(0, 10)
      if (!excludeDates.has(dateStr)) {
        result.push({ date: dateStr, time: sched.time })
      }
    }
  }
  
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
