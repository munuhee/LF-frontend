import { AppSidebar } from "@/components/app-sidebar"
import { ScreenSizeGuard } from "@/components/screen-size-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ScreenSizeGuard>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </ScreenSizeGuard>
  )
}
