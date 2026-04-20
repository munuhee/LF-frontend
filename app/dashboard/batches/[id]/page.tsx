"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Users, ExternalLink, Play, Pause, CheckCircle, Workflow } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { CreateTaskModal } from "@/components/create-task-modal"
import { batches, tasks, defaultUser, getUnclaimedTasksFromBatch } from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"
import type { Task } from "@/lib/types"

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const batch = batches.find((b) => b.id === id)
  const [batchTasks, setBatchTasks] = useState<Task[]>(tasks.filter((t) => t.batchId === id))

  // Get tasks based on role
  const allBatchTasks = batchTasks

  // For annotators: only show their own tasks, not unclaimed ones
  // Unclaimed tasks are shown separately for claiming
  const myTasks = currentUser.role === "annotator"
    ? allBatchTasks.filter(t => t.annotatorId === currentUser.id)
    : allBatchTasks

  // Get unclaimed tasks for annotators to claim
  const unclaimedTasks = getUnclaimedTasksFromBatch(id)

  // Handle new task creation
  const handleTaskCreated = (newTask: Task) => {
    setBatchTasks([...batchTasks, newTask])
  }

  if (!batch) {
    return (
      <>
        <TopBar title="Batch Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Batch not found</h2>
            <p className="text-muted-foreground mb-4">
              The batch you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/batches">Back to Batches</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const inProgressTasks = myTasks.filter(t => ["in-progress", "paused"].includes(t.status))
  const submittedTasks = myTasks.filter(t => ["submitted", "revision-requested"].includes(t.status))
  const completedTasks = myTasks.filter(t => ["approved", "rejected"].includes(t.status))

  return (
    <>
      <TopBar title={batch.title} subtitle={`Batch ${batch.id}`} />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dashboard/batches" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
        </Button>

        {/* Available Tasks to Claim (for annotators) */}
        {currentUser.role === "annotator" && unclaimedTasks.length > 0 && (
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Available Tasks</CardTitle>
              <CardDescription>
                Select a task from this batch to start working on it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={unclaimedTasks} showClaimButton currentUser={currentUser} />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {myTasks.length === 0 && unclaimedTasks.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No tasks available in this batch</p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}

interface TaskListProps {
  tasks: Task[]
  showClaimButton?: boolean
  onTaskDeleted?: (taskId: string) => void
  currentUser: typeof defaultUser
}

function TaskList({ tasks, showClaimButton = false, onTaskDeleted, currentUser }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No tasks found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <PriorityBadge priority={task.priority} />
                  <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {task.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ~{task.estimatedDuration} min
                  </span>
                  {task.actualDuration && (
                    <span>Actual: {task.actualDuration} min</span>
                  )}
                  {task.qualityScore && (
                    <span className="text-success">Score: {task.qualityScore}%</span>
                  )}
                  {/* Show ownership info for admins */}
                  {currentUser.role === "admin" && task.annotatorEmail && (
                    <span>Annotator: {task.annotatorEmail}</span>
                  )}
                  {currentUser.role === "admin" && task.reviewerEmail && (
                    <span>Reviewer: {task.reviewerEmail}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.externalUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={task.externalUrl} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Link>
                  </Button>
                )}
                {currentUser.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Delete
                  </Button>
                )}
                <Button size="sm" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    {showClaimButton ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Claim
                      </>
                    ) : task.status === "in-progress" ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Continue
                      </>
                    ) : task.status === "revision-requested" ? (
                      "Revise"
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        View
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
