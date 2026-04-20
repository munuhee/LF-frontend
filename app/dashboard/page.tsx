"use client"

import Link from "next/link"
import {
  Layers,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Users,
  Clock,
  Workflow,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import {
  dashboardStats,
  adminStats,
  analyticsData,
  batches,
  tasks,
  reviews,
  notifications,
  defaultUser,
  workflows,
  getTasksForUser,
} from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Role-specific stats
const getStatsForRole = (role: string) => {
  if (role === "annotator") {
    return [
      { title: "Available Workflows", value: workflows.filter(w => w.isActive).length, icon: Workflow, color: "text-primary", bgColor: "bg-primary/10" },
      { title: "Active Task", value: dashboardStats.activeTasks, icon: ListTodo, color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { title: "Completed", value: dashboardStats.completedTasks, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
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
      { title: "Total Tasks", value: tasks.filter(t => t.status === "submitted").length, icon: ListTodo, color: "text-primary", bgColor: "bg-primary/10" },
    ]
  }
  // Admin
  return [
    { title: "Total Annotators", value: adminStats.totalAnnotators, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Tasks Completed", value: adminStats.totalTasksCompleted, icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
    { title: "Pending Reviews", value: reviews.filter(r => r.status === "pending").length, icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Daily Tool Usage", value: `${adminStats.dailyToolUsageHours}h`, icon: Clock, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  ]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const statCards = getStatsForRole(currentUser.role)
  const activeWorkflows = workflows.filter(w => w.isActive && w.batchCount > 0).slice(0, 3)
  const myTasks = getTasksForUser(currentUser.id, currentUser.role).slice(0, 4)
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

        {/* Admin Dashboard */}
        {currentUser.role === "admin" && (
          <AdminDashboard />
        )}

        {/* Annotator/Reviewer Dashboard */}
        {currentUser.role !== "admin" && (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Main Content - varies by role */}
            <div className="lg:col-span-2 space-y-4">
              {/* Annotator: Active Workflows */}
              {currentUser.role === "annotator" && (
                <>
                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                      <div>
                        <CardTitle className="text-sm">Active Workflows</CardTitle>
                        <CardDescription className="text-xs">Browse workflows to find tasks</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href="/dashboard/workflows" className="flex items-center gap-1">
                          View all <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {activeWorkflows.map((workflow) => {
                          const workflowBatches = batches.filter(b => b.workflowId === workflow.id)
                          const totalTasks = workflowBatches.reduce((sum, b) => sum + b.tasksTotal, 0)
                          const completedTasks = workflowBatches.reduce((sum, b) => sum + b.tasksCompleted, 0)

                          return (
                            <div key={workflow.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Link href={`/dashboard/workflows/${workflow.id}`} className="font-medium text-sm text-foreground hover:text-primary truncate flex-1">
                                  {workflow.name}
                                </Link>
                                <TaskTypeBadge type={workflow.type} className="text-[10px]" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Tasks */}
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
                      {myTasks.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                          <Button size="sm" className="mt-2" asChild>
                            <Link href="/dashboard/workflows">Browse Workflows</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {myTasks.map((task) => (
                            <div key={task.id} className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center gap-3">
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
                      )}
                    </CardContent>
                  </Card>
                </>
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
                            <span>By: {review.annotatorEmail}</span>
                            <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
                          </div>
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
        )}
      </main>
    </>
  )
}

// Admin Dashboard Component
function AdminDashboard() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="annotators">Annotator Performance</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewer Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Active Batches */}
          <Card className="lg:col-span-2 border-border bg-card">
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
                {batches.filter(b => b.status === "in-progress").slice(0, 4).map((batch) => (
                  <div key={batch.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <PriorityBadge priority={batch.priority} />
                      <span className="font-medium text-sm text-foreground truncate flex-1">{batch.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{batch.tasksTotal} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-border bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Reviewers</span>
                <span className="text-sm font-medium">{adminStats.totalReviewers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Task Time</span>
                <span className="text-sm font-medium">{adminStats.averageTaskTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks Pending</span>
                <span className="text-sm font-medium">{adminStats.totalTasksPending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Workflows</span>
                <span className="text-sm font-medium">{workflows.filter(w => w.isActive).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="annotators">
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Annotator Performance</CardTitle>
                <CardDescription className="text-xs">Tasks completed, quality scores, and time metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Annotator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Tasks Completed</TableHead>
                  <TableHead className="text-right">Avg. Quality</TableHead>
                  <TableHead className="text-right">Avg. Time</TableHead>
                  <TableHead className="text-right">Tool Usage (hrs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.annotatorPerformance.map((annotator) => (
                  <TableRow key={annotator.id} className="border-border">
                    <TableCell className="font-medium">{annotator.name}</TableCell>
                    <TableCell className="text-muted-foreground">{annotator.email}</TableCell>
                    <TableCell className="text-right">{annotator.tasksCompleted}</TableCell>
                    <TableCell className="text-right">
                      <span className={annotator.averageQuality >= 90 ? "text-success" : annotator.averageQuality >= 80 ? "text-warning" : "text-destructive"}>
                        {annotator.averageQuality}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{annotator.averageTimeMinutes} min</TableCell>
                    <TableCell className="text-right">{annotator.totalToolUsageHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviewers">
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm">Reviewer Activity</CardTitle>
                <CardDescription className="text-xs">Reviews completed, approval rates, and timing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Reviews Completed</TableHead>
                  <TableHead className="text-right">Approval Rate</TableHead>
                  <TableHead className="text-right">Avg. Review Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.reviewerActivity.map((reviewer) => (
                  <TableRow key={reviewer.id} className="border-border">
                    <TableCell className="font-medium">{reviewer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{reviewer.email}</TableCell>
                    <TableCell className="text-right">{reviewer.reviewsCompleted}</TableCell>
                    <TableCell className="text-right">
                      <span className={reviewer.approvalRate >= 85 ? "text-success" : reviewer.approvalRate >= 70 ? "text-warning" : "text-destructive"}>
                        {reviewer.approvalRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{reviewer.averageReviewTime} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
