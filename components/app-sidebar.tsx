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
  Bell,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

const getNavItems = (role: string) => {
  const base = [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }]

  if (role === "annotator") return [
    ...base,
    { title: "Work", url: "/dashboard/workflows", icon: ListTodo },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ]

  if (role === "reviewer") return [
    ...base,
    { title: "Reviews", url: "/dashboard/reviews", icon: CheckSquare },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Team", url: "/dashboard/team", icon: Users },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ]

  return [
    ...base,
    { title: "Work", url: "/dashboard/workflows", icon: ListTodo },
    { title: "Reviews", url: "/dashboard/reviews", icon: CheckSquare },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Team", url: "/dashboard/team", icon: Users },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
    { title: "Admin", url: "/dashboard/admin", icon: ShieldCheck },
  ]
}

const secondaryNav = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const mainNav = getNavItems(user?.role ?? "annotator")

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))
    return (
      <Link
        href={item.url}
        title={collapsed ? item.title : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden
          ${collapsed ? "justify-center px-2" : ""}
          ${active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-border bg-card transition-all duration-200 shrink-0 overflow-hidden
        ${collapsed ? "w-[56px]" : "w-[220px]"}`}
    >
      {/* Header */}
      <div className={`flex items-center h-14 border-b border-border px-3 shrink-0 ${collapsed ? "justify-center" : "gap-2"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <span className="text-sm font-bold text-primary-foreground">LF</span>
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-foreground truncate">LabelForge</span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute top-3.5 right-2 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-10
          ${collapsed ? "right-1/2 translate-x-1/2" : ""}`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <PanelLeftClose className="h-4 w-4" />
        }
      </button>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {mainNav.map((item) => <NavItem key={item.url} item={item} />)}

        <div className="my-2 border-t border-border" />

        {secondaryNav.map((item) => <NavItem key={item.url} item={item} />)}
      </nav>

      {/* Footer / user */}
      <div className="border-t border-border px-2 py-3 shrink-0">
        <div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "Loading..."}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">{user?.role ?? ""}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
