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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, TaskTypeBadge } from "@/components/status-badge"
import { Workflow as WorkflowIcon } from "lucide-react"
import { tasks, reviews, defaultUser } from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const { id } = use(params)
  const task = tasks.find((t) => t.id === id)
  const taskReview = reviews.find((r) => r.taskId === id)
  
  const [isRunning, setIsRunning] = useState(task?.status === "in-progress")
  const [notes, setNotes] = useState("")
  const [expandedScreenshots, setExpandedScreenshots] = useState(false)

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
      // Open external link and attach event listeners for extension
      const externalWindow = window.open(task.externalUrl, "_blank")
      if (externalWindow) {
        // Fire custom event for extension to listen to
        const event = new CustomEvent("labelforge:taskStarted", {
          detail: { taskId: task.id, taskType: task.taskType },
        })
        window.dispatchEvent(event)
      }
    }
  }

  const isAnnotator = currentUser.role === "annotator"
  const isReviewer = currentUser.role === "reviewer"
  const isAdmin = currentUser.role === "admin"
  const isMyTask = task.annotatorId === currentUser.id

  // Display first 5 screenshots by default
  const visibleScreenshots = expandedScreenshots 
    ? task.screenshots 
    : task.screenshots?.slice(0, 5)
  const hasMoreScreenshots = (task.screenshots?.length || 0) > 5

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
                    </div>
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <CardDescription className="mt-1 space-y-1">
                      <div>
                        <Link 
                          href={`/dashboard/workflows/${task.workflowId}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {task.workflowName}
                        </Link>
                        <span className="text-muted-foreground/50 mx-2">•</span>
                        <Link 
                          href={`/dashboard/batches/${task.batchId}`} 
                          className="text-primary hover:underline text-sm"
                        >
                          {task.batchTitle}
                        </Link>
                      </div>
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
                        <p className="text-sm font-medium text-xs">
                          {new Date(task.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Link for Agentic AI Tasks */}
            {task.externalUrl && task.taskType === "agentic-ai" && (
              <Card className="border-border bg-card border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Task Environment
                  </CardTitle>
                  <CardDescription>
                    Access the external website where you complete this task. The LabelForge extension will automatically track your activity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="w-full gap-2">
                    <Link href={task.externalUrl} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Open External Link in New Tab
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    The LabelForge browser extension will listen for events and capture your interactions on the external website.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Task Controls (only for annotators working on their own tasks) */}
            {isAnnotator && isMyTask && !["approved", "rejected"].includes(task.status) && (
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
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isRunning ? (
                      <Button onClick={handleStartTask} className="gap-2">
                        <Play className="h-4 w-4" />
                        {task.status === "unclaimed" ? "Start Task" : "Resume Task"}
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
                  </div>

                  {isRunning && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Task Active</span>
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

            {/* Submission Data - For Agentic AI Tasks */}
            {task.submissionData && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Submission Data</CardTitle>
                  <CardDescription>
                    JSON data captured during task completion for AI model learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                      {JSON.stringify(task.submissionData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Screenshots Gallery */}
            {task.screenshots && task.screenshots.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Task Screenshots ({task.screenshots.length})</CardTitle>
                  <CardDescription>
                    Visual record of task completion steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Display visible screenshots */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleScreenshots?.map((screenshot, index) => (
                        <div
                          key={index}
                          className="rounded-lg overflow-hidden border border-border bg-secondary/30 aspect-video"
                        >
                          <img
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Show More/Less Button for screenshots > 5 */}
                    {hasMoreScreenshots && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setExpandedScreenshots(!expandedScreenshots)}
                      >
                        {expandedScreenshots ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Show Less ({task.screenshots.length - 5} hidden)
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View All ({task.screenshots.length} total)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
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
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-2">Reviewer Comments</h5>
                        <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                          {taskReview.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info Card */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Task Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <p className="text-sm font-medium">
                      {new Date(task.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <p className="text-sm font-medium">
                      {new Date(task.completedAt).toLocaleDateString()}
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
