import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="container max-w-7xl py-6">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
