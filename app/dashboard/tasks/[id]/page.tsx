"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Play,
  Pause,
  Square,
  Send,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { tasks, sessions, reviews } from "@/lib/dummy-data"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const task = tasks.find((t) => t.id === id)
  const taskSessions = sessions.filter((s) => s.taskId === id)
  const taskReview = reviews.find((r) => r.taskId === id)
  
  const [isRunning, setIsRunning] = useState(task?.status === "in-progress")
  const [notes, setNotes] = useState("")

  if (!task) {
    return (
      <>
        <TopBar title="Task Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Task not found</h2>
            <p className="text-muted-foreground mb-4">
              The task you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/tasks">Back to Tasks</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const handleStartTask = () => {
    setIsRunning(true)
    if (task.externalUrl) {
      window.open(task.externalUrl, "_blank")
    }
  }

  return (
    <>
      <TopBar title={task.title} subtitle={`Task ${task.id}`} />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dashboard/tasks" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TaskTypeBadge type={task.taskType} />
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <Link href={`/dashboard/batches/${task.batchId}`} className="hover:text-primary">
                        {task.batchTitle}
                      </Link>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(task.estimatedDuration)}
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
                        <p className="text-sm font-medium">
                          {new Date(task.startedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Controls */}
            {!["approved", "rejected"].includes(task.status) && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Task Controls</CardTitle>
                  <CardDescription>
                    {task.taskType === "agentic-ai" 
                      ? "Start the task to open the external website. The LabelForge extension will track your activity."
                      : "Manage your task progress and submit when complete."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {!isRunning ? (
                      <Button onClick={handleStartTask} className="gap-2">
                        <Play className="h-4 w-4" />
                        {task.status === "not-started" ? "Start Task" : "Resume Task"}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setIsRunning(false)} className="gap-2">
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                        <Button variant="destructive" onClick={() => setIsRunning(false)} className="gap-2">
                          <Square className="h-4 w-4" />
                          Stop
                        </Button>
                      </>
                    )}
                    {task.externalUrl && (
                      <Button variant="outline" asChild>
                        <Link href={task.externalUrl} target="_blank" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Open External Site
                        </Link>
                      </Button>
                    )}
                  </div>

                  {isRunning && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Session Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your activity is being recorded. Complete the task on the external site and return here to submit.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Notes (optional)
                    </label>
                    <Textarea
                      placeholder="Add any notes about your work..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px] bg-secondary/30"
                    />
                  </div>

                  <Button className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Submit for Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review Feedback */}
            {taskReview && (
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
                      <StatusBadge status={taskReview.status as any} />
                      {taskReview.reviewerName && (
                        <span className="text-sm text-muted-foreground">
                          by {taskReview.reviewerName}
                        </span>
                      )}
                      {taskReview.reviewedAt && (
                        <span className="text-sm text-muted-foreground">
                          on {new Date(taskReview.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {taskReview.criteriaScores && (
                      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {taskReview.criteriaScores.accuracy}%
                          </p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {taskReview.criteriaScores.completeness}%
                          </p>
                          <p className="text-xs text-muted-foreground">Completeness</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {taskReview.criteriaScores.adherence}%
                          </p>
                          <p className="text-xs text-muted-foreground">Adherence</p>
                        </div>
                      </div>
                    )}

                    {taskReview.feedback && (
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-sm text-foreground">{taskReview.feedback}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session History */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Session History</CardTitle>
                <CardDescription>Your work sessions for this task</CardDescription>
              </CardHeader>
              <CardContent>
                {taskSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions recorded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {taskSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            session.status === "active"
                              ? "bg-primary/20 text-primary"
                              : session.status === "paused"
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }`}>
                            {session.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(Math.floor(session.duration / 60))}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.eventsRecorded} events recorded
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/batches/${task.batchId}`}>
                    View Batch Details
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Report an Issue
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Request Help
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
