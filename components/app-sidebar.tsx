"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Briefcase, Bell, ShieldCheck,
  BarChart3, Clock, LogOut, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

const getNavItems = (role: string) => {
  if (role === "annotator") return [
    { title: "Assignments", url: "/dashboard", icon: LayoutDashboard, exact: true },
    { title: "Work", url: "/dashboard/work", icon: Briefcase },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ]

  if (role === "reviewer") return [
    { title: "Assignments", url: "/dashboard", icon: LayoutDashboard, exact: true },
    { title: "Work", url: "/dashboard/work", icon: Briefcase },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ]

  // Admin
  return [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
    { title: "Work", url: "/dashboard/work", icon: Briefcase },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Hours", url: "/dashboard/hours", icon: Clock },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
    { title: "Admin", url: "/dashboard/admin", icon: ShieldCheck },
  ]
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navItems = getNavItems(user?.role ?? "annotator")

  const initials = user
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = (item as { exact?: boolean }).exact
      ? pathname === item.url
      : pathname === item.url || pathname.startsWith(item.url + "/")
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
    <aside className={`relative flex flex-col h-screen border-r border-border bg-card transition-all duration-200 shrink-0 overflow-hidden
      ${collapsed ? "w-[56px]" : "w-[220px]"}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-border px-3 shrink-0 ${collapsed ? "justify-center" : "gap-2"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <span className="text-sm font-bold text-primary-foreground">LF</span>
        </div>
        {!collapsed && <span className="text-base font-semibold text-foreground truncate">LabelForge</span>}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute top-3.5 right-2 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-10
          ${collapsed ? "right-1/2 translate-x-1/2" : ""}`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {navItems.map(item => <NavItem key={item.url} item={item} />)}
      </nav>

      {/* User footer */}
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
              <button onClick={logout} title="Sign out"
                className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
