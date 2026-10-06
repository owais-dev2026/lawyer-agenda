import { CalendarDays, Gavel, LayoutDashboard, Settings, Users } from 'lucide-react'

export type TabId = 'dashboard' | 'sessions' | 'calendar' | 'clients' | 'backup'

export const NAV_ITEMS: { id: TabId; label: string; icon: typeof Gavel }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'sessions', label: 'الجلسات', icon: Gavel },
  { id: 'calendar', label: 'التقويم', icon: CalendarDays },
  { id: 'clients', label: 'الموكلون', icon: Users },
  { id: 'backup', label: 'الإعدادات', icon: Settings },
]
