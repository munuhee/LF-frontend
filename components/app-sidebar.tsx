"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListTodo,
  CheckSquare,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Workflow,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { defaultUser } from "@/lib/dummy-data"

const getNavItems = (role: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Workflows", url: "/dashboard/workflows", icon: Workflow },
  ]

  if (role === "annotator") {
    return [
      ...baseItems,
      { title: "My Tasks", url: "/dashboard/tasks", icon: ListTodo },
    ]
  }

  if (role === "reviewer") {
    return [
      ...baseItems,
      { title: "Reviews", url: "/dashboard/reviews", icon: CheckSquare },
      { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    ]
  }

  // Admin sees everything
  return [
    ...baseItems,
    { title: "Tasks", url: "/dashboard/tasks", icon: ListTodo },
    { title: "Reviews", url: "/dashboard/reviews", icon: CheckSquare },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  ]
}

const secondaryNavItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const mainNavItems = getNavItems(currentUser.role)

  return (
    <Sidebar className="border-r border-border bg-card" collapsible="icon">
      <SidebarHeader className="p-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">LF</span>
          </div>
          <span className="text-base font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            LabelForge
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.url || 
                  (item.url !== "/dashboard" && pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-foreground hover:bg-secondary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-foreground hover:bg-secondary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator className="mb-3 bg-border" />
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium flex-shrink-0">
            {currentUser.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-foreground truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {`— ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}`}
            </p>
          </div>
          <Link
            href="/"
            className="p-1.5 rounded-md hover:bg-secondary transition-colors group-data-[collapsible=icon]:hidden"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
