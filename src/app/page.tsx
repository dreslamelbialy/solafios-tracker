'use client'

import { useState } from 'react'
import { Sidebar, MobileHeader } from '@/components/solafios/sidebar'
import { DashboardView } from '@/components/solafios/dashboard-view'
import { StudentsView } from '@/components/solafios/students-view'
import { SessionsView } from '@/components/solafios/sessions-view'
import { PaymentsView } from '@/components/solafios/payments-view'
import { FamiliesView } from '@/components/solafios/families-view'
import { HolidaysView } from '@/components/solafios/holidays-view'
import { LocationsView } from '@/components/solafios/locations-view'
import { YearsView } from '@/components/solafios/years-view'
import { SettingsView } from '@/components/solafios/settings-view'
import { useView, ViewKey } from '@/lib/use-view'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'

export default function Home() {
  const { view, setView } = useView()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 border-l border-sidebar-border flex-shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar view={view} setView={setView} />
        </div>
      </aside>
      
      {/* Mobile sidebar (drawer) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <Sidebar view={view} setView={setView} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      
      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <MobileHeader view={view} onMenu={() => setMobileNavOpen(true)} />
        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {view === 'dashboard' && <DashboardView setView={setView} />}
          {view === 'students' && <StudentsView />}
          {view === 'sessions' && <SessionsView />}
          {view === 'payments' && <PaymentsView />}
          {view === 'families' && <FamiliesView />}
          {view === 'holidays' && <HolidaysView />}
          {view === 'locations' && <LocationsView />}
          {view === 'years' && <YearsView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  )
}
