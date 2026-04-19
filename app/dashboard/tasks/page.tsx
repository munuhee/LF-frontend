"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, ExternalLink, Play, Pause, CheckCircle, Filter, ChevronDown, ChevronRight, Workflow } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, TaskTypeBadge } from "@/components/status-badge"
import { tasks, defaultUser, getTasksForUser } from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"
import type { TaskStatus } from "@/lib/types"

export default function TasksPage() {
  const { user } = useAuth()
  const currentUser = user || defaultUser
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  // Get tasks based on user role - annotators only see their assigned tasks (not unclaimed)
  const myTasks = getTasksForUser(currentUser.id, currentUser.role)
  
  const filteredTasks = myTasks.filter((task) => {
    return statusFilter === "all" || task.status === statusFilter
  })

  const activeTasks = filteredTasks.filter(t => ["in-progress", "paused"].includes(t.status))
  const submittedTasks = filteredTasks.filter(t => ["submitted", "revision-requested"].includes(t.status))
  const completedTasks = filteredTasks.filter(t => ["approved", "rejected"].includes(t.status))

  // For admin view - get all tasks
  const isAdmin = currentUser.role === "admin"

  return (
    <>
      <TopBar 
        title={isAdmin ? "All Tasks" : "My Tasks"} 
        subtitle={isAdmin ? "View all tasks across the platform" : "View and manage your assigned tasks"} 
      />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
            <SelectTrigger className="w-[160px] bg-card border-border h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revision-requested">Revision Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger value="all" className="text-xs">All ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active ({activeTasks.length})</TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs">In Review ({submittedTasks.length})</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TaskList tasks={filteredTasks} expandedFeedback={expandedFeedback} setExpandedFeedback={setExpandedFeedback} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="active">
            <TaskList tasks={activeTasks} expandedFeedback={expandedFeedback} setExpandedFeedback={setExpandedFeedback} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="submitted">
            <TaskList tasks={submittedTasks} expandedFeedback={expandedFeedback} setExpandedFeedback={setExpandedFeedback} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="completed">
            <TaskList tasks={completedTasks} expandedFeedback={expandedFeedback} setExpandedFeedback={setExpandedFeedback} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

interface TaskListProps {
  tasks: typeof import("@/lib/dummy-data").tasks
  expandedFeedback: string | null
  setExpandedFeedback: (id: string | null) => void
  isAdmin?: boolean
}

function TaskList({ tasks, expandedFeedback, setExpandedFeedback, isAdmin = false }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">No tasks found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card key={task.id} className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link 
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium text-foreground hover:text-primary truncate text-sm"
                  >
                    {task.title}
                  </Link>
                  <TaskTypeBadge type={task.taskType} className="text-[10px] px-1.5 py-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link 
                    href={`/dashboard/workflows/${task.workflowId}`}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Workflow className="h-3 w-3" />
                    {task.workflowName}
                  </Link>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{task.batchTitle}</span>
                </div>
                {/* Show ownership info for admins */}
                {isAdmin && (
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    {task.annotatorEmail && <span>Annotator: {task.annotatorEmail}</span>}
                    {task.reviewerEmail && <span>Reviewer: {task.reviewerEmail}</span>}
                  </div>
                )}
              </div>

              {/* Status & Duration */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimatedDuration}m
                </span>
                <StatusBadge status={task.status} className="text-[10px]" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.externalUrl && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={task.externalUrl} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
                <Button size="sm" className="h-7 text-xs px-2.5" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    {task.status === "in-progress" ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Continue
                      </>
                    ) : task.status === "revision-requested" ? (
                      "Revise"
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        View
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Feedback (collapsible) */}
            {task.feedback && (
              <Collapsible 
                open={expandedFeedback === task.id}
                onOpenChange={(open) => setExpandedFeedback(open ? task.id : null)}
              >
                <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground">
                  {expandedFeedback === task.id ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {task.qualityScore && (
                    <span className="text-success font-medium mr-1">{task.qualityScore}%</span>
                  )}
                  Feedback
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
                    {task.feedback}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
