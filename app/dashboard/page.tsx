'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Layers, ListTodo, CheckCircle2, AlertCircle, TrendingUp,
  ArrowRight, ExternalLink, Users, Clock, Workflow, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/top-bar'
import { StatusBadge, PriorityBadge, TaskTypeBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Task, Review, Notification, Workflow as WorkflowType, Batch } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [wfs, notifs] = await Promise.all([
          api.workflows.list({ active: 'true' }),
          api.notifications.list(),
        ])
        setWorkflows(wfs)
        setNotifications(notifs)

        if (user.role === 'annotator') {
          const myTasks = await api.tasks.list({ mine: 'true' })
          setTasks(myTasks)
        } else if (user.role === 'reviewer') {
          const revs = await api.reviews.list()
          setReviews(revs)
        } else if (user.role === 'admin') {
          const [analyticsData, allBatches] = await Promise.all([
            api.analytics.get(),
            api.batches.list(),
          ])
          setAnalytics(analyticsData)
          setBatches(allBatches)
        }
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load') }
    }
    load()
  }, [user])

  if (!user) return null

  const statCards = getStatsForRole(user.role, tasks, reviews, workflows, analytics)
  const activeWorkflows = workflows.filter(w => w.isActive).slice(0, 3)
  const myTasks = tasks.slice(0, 4)
  const pendingReviews = reviews.filter(r => r.status === 'pending').slice(0, 4)
  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 4)

  return (
    <>
      <TopBar
        title={`Welcome, ${user.name.split(' ')[0]}`}
        subtitle={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`}
      />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : (<>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {statCards.map(stat => (
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

        {user.role === 'admin' && <AdminDashboard analytics={analytics} batches={batches} />}

        {user.role !== 'admin' && (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {user.role === 'annotator' && (
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
                        {activeWorkflows.map(w => (
                          <div key={w.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                            <div className="flex items-center gap-2">
                              <Link href={`/dashboard/workflows/${w.id}`} className="font-medium text-sm text-foreground hover:text-primary truncate flex-1">
                                {w.name}
                              </Link>
                              <TaskTypeBadge type={w.type} className="text-[10px]" />
                            </div>
                          </div>
                        ))}
                        {activeWorkflows.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No active workflows</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                      <div>
                        <CardTitle className="text-sm">Your Tasks</CardTitle>
                        <CardDescription className="text-xs">Quick access to your tasks</CardDescription>
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
                          <p className="text-sm text-muted-foreground">No tasks yet</p>
                          <Button size="sm" className="mt-2" asChild>
                            <Link href="/dashboard/workflows">Browse Workflows</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {myTasks.map(task => (
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
                                  <Link href={task.externalUrl} target="_blank"><ExternalLink className="h-3 w-3" /></Link>
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

              {user.role === 'reviewer' && (
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
                      {pendingReviews.map(review => (
                        <div key={review.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                          <div className="flex items-center justify-between mb-1">
                            <Link href={`/dashboard/tasks/${review.taskId}`} className="font-medium text-sm text-foreground hover:text-primary truncate">
                              {review.taskTitle}
                            </Link>
                            <Button size="sm" className="h-6 text-xs px-2" asChild>
                              <Link href="/dashboard/reviews">Review</Link>
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">{review.batchTitle}</p>
                          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                            <span>By: {review.annotatorEmail}</span>
                            <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {pendingReviews.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending reviews</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notifications */}
            <Card className="border-border bg-card h-fit">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Latest notifications</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {unreadNotifications.map(n => (
                    <div key={n.id} className="p-2 rounded-lg border border-border bg-secondary/20 cursor-pointer hover:bg-secondary/40">
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {unreadNotifications.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No new notifications</p>
                  )}
                  <Button variant="ghost" size="sm" className="w-full text-xs mt-1" asChild>
                    <Link href="/dashboard/notifications">View all notifications</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}</>)}
      </main>
    </>
  )
}

function getStatsForRole(role: string, tasks: Task[], reviews: Review[], workflows: WorkflowType[], analytics: Record<string, unknown> | null) {
  const summary = (analytics?.summary as Record<string, number>) || {}
  if (role === 'annotator') {
    return [
      { title: 'Available Workflows', value: workflows.filter(w => w.isActive).length, icon: Workflow, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Active Tasks', value: tasks.filter(t => t.status === 'in-progress').length, icon: ListTodo, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      { title: 'Completed', value: tasks.filter(t => t.status === 'approved').length, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
      { title: 'Submitted', value: tasks.filter(t => t.status === 'submitted').length, icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
    ]
  }
  if (role === 'reviewer') {
    return [
      { title: 'Pending Reviews', value: reviews.filter(r => r.status === 'pending').length, icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10' },
      { title: 'My Active', value: reviews.filter(r => r.status === 'in-review').length, icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      { title: 'Approved', value: reviews.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
      { title: 'Total Reviews', value: reviews.length, icon: ListTodo, color: 'text-primary', bgColor: 'bg-primary/10' },
    ]
  }
  return [
    { title: 'Total Annotators', value: summary.totalAnnotators || 0, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Tasks Completed', value: summary.completedTasks || 0, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
    { title: 'Pending Reviews', value: summary.pendingReviews || 0, icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10' },
    { title: 'Active Tasks', value: summary.activeTasks || 0, icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  ]
}

function AdminDashboard({ analytics, batches }: { analytics: Record<string, unknown> | null; batches: Batch[] }) {
  const annotatorPerformance = (analytics?.annotatorPerformance as Record<string, unknown>[]) || []
  const reviewerActivity = (analytics?.reviewerActivity as Record<string, unknown>[]) || []
  const activeBatches = batches.filter(b => b.status === 'in-progress')

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="annotators">Annotators</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div>
                <CardTitle className="text-sm">Active Batches</CardTitle>
                <CardDescription className="text-xs">Currently in-progress work</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/dashboard/batches" className="flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {activeBatches.slice(0, 4).map(batch => (
                  <div key={batch.id} className="p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={batch.priority} />
                      <span className="font-medium text-sm text-foreground truncate flex-1">{batch.title}</span>
                      <span className="text-xs text-muted-foreground">{batch.tasksTotal} tasks</span>
                    </div>
                  </div>
                ))}
                {activeBatches.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active batches</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button className="w-full justify-start text-xs h-8" size="sm" asChild>
                <Link href="/dashboard/admin"><Users className="h-3.5 w-3.5 mr-2" />Manage Users</Link>
              </Button>
              <Button className="w-full justify-start text-xs h-8" variant="outline" size="sm" asChild>
                <Link href="/dashboard/workflows"><Workflow className="h-3.5 w-3.5 mr-2" />Create Workflow</Link>
              </Button>
              <Button className="w-full justify-start text-xs h-8" variant="outline" size="sm" asChild>
                <Link href="/dashboard/reports"><BarChart3 className="h-3.5 w-3.5 mr-2" />View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="annotators">
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Annotator Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead className="text-right">Avg Quality</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annotatorPerformance.map((a) => (
                  <TableRow key={a.id as string} className="border-border">
                    <TableCell className="font-medium">{a.name as string}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email as string}</TableCell>
                    <TableCell className="text-right">{a.tasksCompleted as number}</TableCell>
                    <TableCell className="text-right">
                      <span className={Number(a.averageQuality) >= 90 ? 'text-success' : 'text-warning'}>
                        {a.averageQuality as number}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{a.averageTimeMinutes as number}m</TableCell>
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
            <CardTitle className="text-sm">Reviewer Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right">Approval Rate</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewerActivity.map(r => (
                  <TableRow key={r.id as string} className="border-border">
                    <TableCell className="font-medium">{r.name as string}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email as string}</TableCell>
                    <TableCell className="text-right">{r.reviewsCompleted as number}</TableCell>
                    <TableCell className="text-right">
                      <span className={Number(r.approvalRate) >= 85 ? 'text-success' : 'text-warning'}>
                        {r.approvalRate as number}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{r.averageReviewTime as number}m</TableCell>
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
