'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Clock, CheckCircle2, AlertCircle, Users, TrendingUp, BarChart3, Workflow } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/top-bar'
import { PriorityBadge } from '@/components/status-badge'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Batch, Review } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null
  if (user.role === 'annotator') return <AnnotatorAssignments />
  if (user.role === 'reviewer') return <ReviewerAssignments />
  return <AdminDashboard />
}

// ─── Annotator ───────────────────────────────────────────────────────────────

function AnnotatorAssignments() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [activeTasks, setActiveTasks] = useState<{ id: string; title: string; status: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.batches.list(), api.tasks.list({ mine: 'true' })])
      .then(([b, t]) => {
        setBatches(b)
        setActiveTasks(
          t.filter((tk: { status: string }) =>
            ['in-progress', 'paused', 'revision-requested'].includes(tk.status)
          )
        )
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleStart = async (batchId: string) => {
    try {
      const tasks = await api.tasks.list({ batchId, status: 'unclaimed' })
      if (!tasks.length) { alert('No unclaimed tasks in this batch.'); return }
      const task = tasks[Math.floor(Math.random() * tasks.length)]
      await api.tasks.action(task.id, 'claim')
      window.location.href = `/dashboard/tasks/${task.id}`
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
  }

  const available = batches.filter(b => b.tasksTotal > 0 && (b.status === 'available' || b.tasksTotal > b.tasksCompleted))
  const hasRework = activeTasks.some(t => t.status === 'revision-requested')
  const hasInProgress = activeTasks.some(t => ['in-progress', 'paused'].includes(t.status))
  // Block claiming a new task if they already have one active or have rework pending
  const claimBlocked = activeTasks.length > 0
  const blockReason = hasRework
    ? 'Complete your rework task before starting a new one.'
    : hasInProgress
      ? 'Finish your current task before starting a new one.'
      : ''

  return (
    <>
      <TopBar title="Assignments" subtitle={`Welcome back, ${user?.name.split(' ')[0]}`} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Active task banner */}
        {claimBlocked && (
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${hasRework ? 'bg-warning/10 border-warning/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${hasRework ? 'text-warning' : 'text-blue-400'}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${hasRework ? 'text-warning' : 'text-blue-400'}`}>
                {hasRework ? 'Rework required — claiming disabled' : 'Task in progress — claiming disabled'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{blockReason}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 cursor-pointer"
              onClick={() => window.location.href = '/dashboard/work'} />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : available.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No assignments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your admin will assign you to a workflow.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {available.map(batch => {
              const remaining = batch.tasksTotal - batch.tasksCompleted
              return (
                <Card key={batch.id} className={`border-border bg-card ${claimBlocked ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground">{batch.title}</h3>
                          <PriorityBadge priority={batch.priority} />
                          {batch.deadline && (
                            <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                              Due {new Date(batch.deadline).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{batch.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{remaining} tasks remaining</span>
                        </div>
                      </div>
                      <Button size="sm" className="gap-1.5 shrink-0" disabled={claimBlocked}
                        onClick={() => handleStart(batch.id)}
                        title={claimBlocked ? blockReason : undefined}>
                        <Play className="h-3.5 w-3.5" />Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

// ─── Reviewer ────────────────────────────────────────────────────────────────

function ReviewerAssignments() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.reviews.list()
      .then(rv => setReviews(rv))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const pending = reviews.filter(r => r.status === 'pending')
  const myActive = reviews.filter(r => r.status === 'in-review' && r.reviewerId === user?.id)
  // Block claiming when reviewer already has one active review
  const claimBlocked = myActive.length >= 1

  const handleClaim = async (reviewId: string) => {
    try {
      await api.reviews.claim(reviewId)
      window.location.href = '/dashboard/work'
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
  }

  return (
    <>
      <TopBar title="Assignments" subtitle={`Welcome back, ${user?.name.split(' ')[0]}`} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Active review banner */}
        {claimBlocked && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Clock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-400">Review in progress — claiming disabled</p>
              <p className="text-xs text-muted-foreground mt-0.5">Complete your active review before claiming another.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* My Active Reviews */}
            {myActive.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />In Progress ({myActive.length})
                </h2>
                <div className="space-y-2">
                  {myActive.map(r => (
                    <Card key={r.id} className="border-border bg-card border-l-2 border-l-blue-400">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{r.taskTitle}</p>
                          <p className="text-xs text-muted-foreground">{r.batchTitle}</p>
                        </div>
                        <Button size="sm" className="gap-1.5 h-7 text-xs" asChild>
                          <Link href={`/dashboard/tasks/${r.taskId}`}><Play className="h-3.5 w-3.5" />Continue</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Queue */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />Queue ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <Card className="border-border bg-card">
                  <CardContent className="flex items-center justify-center py-10">
                    <p className="text-sm text-muted-foreground">No reviews pending</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pending.map(r => (
                    <Card key={r.id} className={`border-border bg-card ${claimBlocked ? 'opacity-60' : ''}`}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{r.taskTitle}</p>
                          <p className="text-xs text-muted-foreground">{r.batchTitle} · By {r.annotatorName}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(r.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                          disabled={claimBlocked} onClick={() => handleClaim(r.id)}
                          title={claimBlocked ? 'Complete your active review first' : undefined}>
                          <Play className="h-3.5 w-3.5" />Start Review
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

// ─── Admin ───────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.analytics.get()
      .then(setAnalytics)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const summary = (analytics?.summary as Record<string, number>) || {}
  const annotatorPerf = (analytics?.annotatorPerformance as Record<string, unknown>[]) || []
  const reviewerAct = (analytics?.reviewerActivity as Record<string, unknown>[]) || []

  const summaryCards = [
    { label: 'Total Annotators', value: summary.totalAnnotators ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Tasks Completed', value: summary.completedTasks ?? 0, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Pending Reviews', value: summary.pendingReviews ?? 0, icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Active Tasks', value: summary.activeTasks ?? 0, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  return (
    <>
      <TopBar title="Dashboard" subtitle="Platform overview" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-destructive text-sm text-center py-12">{error}</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summaryCards.map(c => (
                <Card key={c.label} className="border-border bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${c.bg}`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
                      <div>
                        <p className="text-xl font-bold">{c.value}</p>
                        <p className="text-[10px] text-muted-foreground">{c.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5 text-xs" asChild>
                <Link href="/dashboard/admin"><Users className="h-3.5 w-3.5" />Manage Users</Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                <Link href="/dashboard/work"><Workflow className="h-3.5 w-3.5" />Filter Tasks</Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                <Link href="/dashboard/reports"><BarChart3 className="h-3.5 w-3.5" />Reports</Link>
              </Button>
            </div>

            {/* Team lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Annotators</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{annotatorPerf.length}</Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {annotatorPerf.length === 0
                    ? <p className="text-xs text-muted-foreground">No annotators yet</p>
                    : annotatorPerf.slice(0, 5).map(a => (
                        <div key={a.id as string} className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary text-[10px] font-medium flex items-center justify-center shrink-0">
                            {(a.name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{a.name as string}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{a.email as string}</p>
                          </div>
                        </div>
                      ))
                  }
                  <Link href="/dashboard/admin" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Reviewers</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{reviewerAct.length}</Badge>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {reviewerAct.length === 0
                    ? <p className="text-xs text-muted-foreground">No reviewers yet</p>
                    : reviewerAct.slice(0, 5).map(r => (
                        <div key={r.id as string} className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center justify-center shrink-0">
                            {(r.name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{r.name as string}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.email as string}</p>
                          </div>
                        </div>
                      ))
                  }
                  <Link href="/dashboard/admin" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1">
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  )
}
