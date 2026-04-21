'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, ExternalLink, Play, Pause, Square, Send,
  MessageSquare, Flag, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { TopBar } from '@/components/top-bar'
import { StatusBadge, TaskTypeBadge } from '@/components/status-badge'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Task } from '@/lib/types'

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [notes, setNotes] = useState('')
  const [isFlagged, setIsFlagged] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [escalationNote, setEscalationNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    api.tasks.get(id)
      .then(t => { setTask(t); setIsRunning(t.status === 'in-progress'); setNotes(t.notes || '') })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleAction = async (action: string, extras?: Record<string, unknown>) => {
    if (!task) return
    setIsSubmitting(true)
    try {
      const updated = await api.tasks.action(id, action, extras)
      setTask(updated)
      if (action === 'resume') setIsRunning(true)
      if (action === 'pause' || action === 'stop') setIsRunning(false)
      if (action === 'submit') setIsRunning(false)
      if (task.externalUrl && action === 'claim') {
        window.dispatchEvent(new CustomEvent('labelforge:taskStarted', { detail: { taskId: id, taskType: task.taskType } }))
        window.open(task.externalUrl, '_blank')
      }
    } catch (e) { /* show toast in production */ }
    finally { setIsSubmitting(false) }
  }

  const formatDuration = (m: number) => {
    const h = Math.floor(m / 60), mins = m % 60
    return h > 0 ? `${h}h ${mins}m` : `${mins}m`
  }

  if (isLoading) return (
    <>
      <TopBar title="Loading..." />
      <main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main>
    </>
  )

  if (error) return (
    <>
      <TopBar title="Task" />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
      </main>
    </>
  )

  if (!task) return (
    <>
      <TopBar title="Task Not Found" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Task not found</h2>
          <Button asChild><Link href="/dashboard/tasks">Back to Tasks</Link></Button>
        </div>
      </main>
    </>
  )

  const isAnnotator = user?.role === 'annotator'
  const isMyTask = task.annotatorId === user?.id

  return (
    <>
      <TopBar title={task.title} subtitle={`Task · ${task.batchTitle}`} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dashboard/tasks" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />Back to Tasks
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <TaskTypeBadge type={task.taskType} />
                  <StatusBadge status={task.status} />
                </div>
                <CardTitle className="text-xl">{task.title}</CardTitle>
                <CardDescription className="space-y-1">
                  <Link href={`/dashboard/workflows/${task.workflowId}`} className="text-primary hover:underline text-sm">{task.workflowName}</Link>
                  <span className="text-muted-foreground/50 mx-2">•</span>
                  <Link href={`/dashboard/batches/${task.batchId}`} className="text-primary hover:underline text-sm">{task.batchTitle}</Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Est. Time</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />{formatDuration(task.estimatedDuration)}
                    </p>
                  </div>
                  {task.actualDuration && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Actual Time</p>
                      <p className="text-sm font-medium">{formatDuration(task.actualDuration)}</p>
                    </div>
                  )}
                  {task.qualityScore && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
                      <p className="text-sm font-medium text-success">{task.qualityScore}%</p>
                    </div>
                  )}
                  {task.startedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Started</p>
                      <p className="text-sm font-medium">{new Date(task.startedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Link */}
            {task.externalUrl && task.taskType === 'agentic-ai' && (
              <Card className="border-border bg-card border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />Task Environment
                  </CardTitle>
                  <CardDescription>
                    The LabelForge extension will track your activity automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="w-full gap-2">
                    <Link href={task.externalUrl} target="_blank">
                      <ExternalLink className="h-4 w-4" />Open External Link
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Task Controls */}
            {isAnnotator && isMyTask && !['approved', 'rejected'].includes(task.status) && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Task Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isRunning ? (
                      <Button onClick={() => handleAction(task.status === 'unclaimed' ? 'claim' : 'resume')} disabled={isSubmitting} className="gap-2">
                        <Play className="h-4 w-4" />
                        {task.status === 'unclaimed' ? 'Start Task' : 'Resume Task'}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => handleAction('pause')} disabled={isSubmitting} className="gap-2">
                          <Pause className="h-4 w-4" />Pause
                        </Button>
                        <Button variant="destructive" onClick={() => { setIsRunning(false) }} className="gap-2">
                          <Square className="h-4 w-4" />Stop
                        </Button>
                      </>
                    )}
                  </div>

                  {isRunning && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Task Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Your activity is being recorded.</p>
                    </div>
                  )}

                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add any notes about your work..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="min-h-[100px] bg-secondary/30"
                    />
                  </div>
                  <Button className="w-full gap-2" onClick={() => handleAction('submit', { notes })} disabled={isSubmitting || task.status === 'submitted'}>
                    <Send className="h-4 w-4" />
                    {task.status === 'submitted' ? 'Already Submitted' : 'Submit for Review'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Annotator Quick Actions */}
            {isAnnotator && isMyTask && !['approved', 'rejected'].includes(task.status) && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setIsFlagged(!isFlagged)}
                      className={`gap-2 ${isFlagged ? 'border-yellow-500 bg-yellow-50/10' : ''}`}>
                      <Flag className={`h-4 w-4 ${isFlagged ? 'fill-yellow-500' : ''}`} />
                      {isFlagged ? 'Flagged' : 'Flag Task'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEscalation(!showEscalation)} className="gap-2">
                      <AlertCircle className="h-4 w-4" />Escalate
                    </Button>
                  </div>
                  {showEscalation && (
                    <div className="p-3 rounded-lg border border-yellow-500/50 bg-yellow-50/10 space-y-3">
                      <Textarea
                        placeholder="Explain why this task needs escalation..."
                        value={escalationNote}
                        onChange={e => setEscalationNote(e.target.value)}
                        className="min-h-[80px] bg-secondary/30 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={isSubmitting}>
                          <AlertCircle className="h-4 w-4 mr-1" />Escalate to Manager
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowEscalation(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Review Feedback */}
            {task.review && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Review Feedback</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={task.review.status as Parameters<typeof StatusBadge>[0]['status']} />
                      {task.review.reviewerName && <span className="text-sm text-muted-foreground">by {task.review.reviewerName}</span>}
                    </div>
                    {task.review.criteriaScores && (
                      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{task.review.criteriaScores.accuracy}%</p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{task.review.criteriaScores.completeness}%</p>
                          <p className="text-xs text-muted-foreground">Completeness</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{task.review.criteriaScores.adherence}%</p>
                          <p className="text-xs text-muted-foreground">Adherence</p>
                        </div>
                      </div>
                    )}
                    {task.review.comments && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Reviewer Comments</h5>
                        <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">{task.review.comments}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isAnnotator && isMyTask && !['approved', 'rejected'].includes(task.status) && (
              <Card className="border-border bg-card border-primary/50">
                <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full gap-2" size="sm" onClick={() => handleAction('submit', { notes })} disabled={isSubmitting}>
                    <CheckCircle2 className="h-4 w-4" />Submit for Review
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-base">Task Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {task.annotatorEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <p className="text-sm font-medium">{task.annotatorEmail}</p>
                  </div>
                )}
                {task.reviewerEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reviewed By</p>
                    <p className="text-sm font-medium">{task.reviewerEmail}</p>
                  </div>
                )}
                {task.submittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="text-sm font-medium">{new Date(task.submittedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <p className="text-sm font-medium">{new Date(task.completedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {isFlagged && (
                  <div className="p-2 rounded-lg bg-yellow-50/10 border border-yellow-500/50">
                    <p className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                      <Flag className="h-3 w-3 fill-current" />Flagged for Review
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
