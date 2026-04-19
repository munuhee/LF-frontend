import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ScreenSizeGuard } from "@/components/screen-size-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ScreenSizeGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ScreenSizeGuard>
  )
}
