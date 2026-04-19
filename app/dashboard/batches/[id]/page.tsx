"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Users, ExternalLink, Play, Pause, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { batches, tasks } from "@/lib/dummy-data"

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const batch = batches.find((b) => b.id === id)
  const batchTasks = tasks.filter((t) => t.batchId === id)

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

  const notStartedTasks = batchTasks.filter(t => t.status === "not-started")
  const inProgressTasks = batchTasks.filter(t => t.status === "in-progress")
  const completedTasks = batchTasks.filter(t => ["submitted", "approved", "completed"].includes(t.status))

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

        {/* Batch Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TaskTypeBadge type={batch.taskType} />
                    <StatusBadge status={batch.status} />
                    <PriorityBadge priority={batch.priority} />
                  </div>
                  <CardTitle className="text-xl">{batch.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {batch.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">
                      {batch.tasksCompleted} / {batch.tasksTotal} tasks ({Math.round((batch.tasksCompleted / batch.tasksTotal) * 100)}%)
                    </span>
                  </div>
                  <Progress
                    value={(batch.tasksCompleted / batch.tasksTotal) * 100}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{notStartedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Not Started</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{completedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Deadline
                </span>
                <span className="text-sm font-medium">
                  {new Date(batch.deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Est. Workload
                </span>
                <span className="text-sm font-medium">{batch.workloadEstimate} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned
                </span>
                <span className="text-sm font-medium">
                  {batch.assignedTo?.length || 0} annotators
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all">All Tasks ({batchTasks.length})</TabsTrigger>
            <TabsTrigger value="not-started">Not Started ({notStartedTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TaskList tasks={batchTasks} />
          </TabsContent>
          <TabsContent value="not-started">
            <TaskList tasks={notStartedTasks} />
          </TabsContent>
          <TabsContent value="in-progress">
            <TaskList tasks={inProgressTasks} />
          </TabsContent>
          <TabsContent value="completed">
            <TaskList tasks={completedTasks} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

function TaskList({ tasks }: { tasks: typeof import("@/lib/dummy-data").tasks }) {
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
                  <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
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
                <Button size="sm" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    {task.status === "not-started" ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    ) : task.status === "in-progress" ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Continue
                      </>
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
