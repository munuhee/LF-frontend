"use client"

import Link from "next/link"
import {
  Layers,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import {
  dashboardStats,
  batches,
  tasks,
  reviews,
  notifications,
  currentUser,
} from "@/lib/dummy-data"

// Role-specific stats
const getStatsForRole = (role: string) => {
  if (role === "annotator") {
    return [
      { title: "Available Batches", value: dashboardStats.availableBatches, icon: Layers, color: "text-primary", bgColor: "bg-primary/10" },
      { title: "Active Task", value: dashboardStats.activeTasks, icon: ListTodo, color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { title: "Completed", value: dashboardStats.completedSessions, icon: Clock, color: "text-success", bgColor: "bg-success/10" },
      { title: "Avg. Quality", value: `${dashboardStats.averageQualityScore}%`, icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10" },
    ]
  }
  if (role === "reviewer") {
    const pendingCount = reviews.filter(r => r.status === "pending").length
    const completedCount = reviews.filter(r => ["approved", "rejected", "revision-requested"].includes(r.status)).length
    return [
      { title: "Pending Reviews", value: pendingCount, icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" },
      { title: "Completed Reviews", value: completedCount, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
      { title: "Active Batches", value: batches.filter(b => b.status === "in-progress").length, icon: Layers, color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { title: "Total Tasks", value: tasks.length, icon: ListTodo, color: "text-primary", bgColor: "bg-primary/10" },
    ]
  }
  // Admin
  return [
    { title: "Total Batches", value: batches.length, icon: Layers, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Active Tasks", value: tasks.filter(t => t.status === "in-progress").length, icon: ListTodo, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { title: "Pending Reviews", value: reviews.filter(r => r.status === "pending").length, icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Team Members", value: 6, icon: Users, color: "text-success", bgColor: "bg-success/10" },
  ]
}

export default function DashboardPage() {
  const statCards = getStatsForRole(currentUser.role)
  const activeBatches = batches.filter(b => b.status === "in-progress").slice(0, 3)
  const recentTasks = tasks.filter(t => t.assignedTo === currentUser.id).slice(0, 4)
  const pendingReviews = reviews.filter(r => r.status === "pending").slice(0, 4)
  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 4)

  return (
    <>
      <TopBar 
        title={`Welcome, ${currentUser.name.split(" ")[0]}`}
        subtitle={`${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard`}
      />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Content - varies by role */}
          <div className="lg:col-span-2 space-y-4">
            {/* Annotator: Active Batches */}
            {currentUser.role === "annotator" && (
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div>
                    <CardTitle className="text-sm">Active Batches</CardTitle>
                    <CardDescription className="text-xs">Your current assignments</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/dashboard/batches" className="flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {activeBatches.map((batch) => (
                      <div key={batch.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <PriorityBadge priority={batch.priority} />
                          <Link href={`/dashboard/batches/${batch.id}`} className="font-medium text-sm text-foreground hover:text-primary truncate flex-1">
                            {batch.title}
                          </Link>
                          <TaskTypeBadge type={batch.taskType} className="text-[10px]" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>{batch.tasksCompleted} / {batch.tasksTotal} tasks</span>
                          <span>Due: {new Date(batch.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <Progress value={(batch.tasksCompleted / batch.tasksTotal) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviewer: Pending Reviews */}
            {currentUser.role === "reviewer" && (
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div>
                    <CardTitle className="text-sm">Pending Reviews</CardTitle>
                    <CardDescription className="text-xs">Tasks awaiting your review</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/dashboard/reviews" className="flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {pendingReviews.map((review) => (
                      <div key={review.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/dashboard/tasks/${review.taskId}`} className="font-medium text-sm text-foreground hover:text-primary truncate">
                            {review.taskTitle}
                          </Link>
                          <Button size="sm" className="h-6 text-xs px-2">Review</Button>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{review.batchTitle}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>By: {review.annotatorName}</span>
                          <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin: Overview */}
            {currentUser.role === "admin" && (
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div>
                    <CardTitle className="text-sm">Active Batches</CardTitle>
                    <CardDescription className="text-xs">All in-progress work</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/dashboard/batches" className="flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {activeBatches.map((batch) => (
                      <div key={batch.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <PriorityBadge priority={batch.priority} />
                          <span className="font-medium text-sm text-foreground truncate flex-1">{batch.title}</span>
                          <StatusBadge status={batch.status} className="text-[10px]" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>{batch.tasksCompleted} / {batch.tasksTotal} tasks</span>
                          <span>{batch.assignedTo?.length || 0} assignees</span>
                        </div>
                        <Progress value={(batch.tasksCompleted / batch.tasksTotal) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks (Annotator only) */}
            {currentUser.role === "annotator" && (
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div>
                    <CardTitle className="text-sm">Your Tasks</CardTitle>
                    <CardDescription className="text-xs">Quick access to assigned tasks</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href="/dashboard/tasks" className="flex items-center gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center gap-3">
                        <PriorityBadge priority={task.priority} className="w-7 justify-center text-[10px]" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/dashboard/tasks/${task.id}`} className="font-medium text-sm text-foreground hover:text-primary truncate block">
                            {task.title}
                          </Link>
                          <p className="text-[10px] text-muted-foreground truncate">{task.batchTitle}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{task.estimatedDuration}m</span>
                        <StatusBadge status={task.status} className="text-[10px]" />
                        {task.externalUrl && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                            <Link href={task.externalUrl} target="_blank">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notifications Sidebar */}
          <Card className="border-border bg-card h-fit">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest notifications</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-2 rounded-lg border border-border bg-secondary/20 cursor-pointer hover:bg-secondary/40"
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{notification.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
