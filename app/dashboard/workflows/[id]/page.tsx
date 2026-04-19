"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Layers, ListTodo, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { workflows, batches } from "@/lib/dummy-data"

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const workflow = workflows.find((w) => w.id === id)
  const workflowBatches = batches.filter((b) => b.workflowId === id)

  if (!workflow) {
    return (
      <>
        <TopBar title="Workflow Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
            <p className="text-muted-foreground mb-4">
              The workflow you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/workflows">Back to Workflows</Link>
            </Button>
          </div>
        </main>
      </>
    )
  }

  const availableBatches = workflowBatches.filter(b => b.status === "available")
  const inProgressBatches = workflowBatches.filter(b => b.status === "in-progress")
  const completedBatches = workflowBatches.filter(b => b.status === "completed")

  const totalTasks = workflowBatches.reduce((sum, b) => sum + b.tasksTotal, 0)
  const completedTasks = workflowBatches.reduce((sum, b) => sum + b.tasksCompleted, 0)
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <>
      <TopBar title={workflow.name} subtitle={`Workflow ${workflow.id}`} />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dashboard/workflows" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>

        {/* Workflow Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TaskTypeBadge type={workflow.type} />
                    <PriorityBadge priority={workflow.priority} />
                    {!workflow.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{workflow.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {workflow.description}
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
                      {completedTasks} / {totalTasks} tasks ({Math.round(progress)}%)
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{availableBatches.length}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{inProgressBatches.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{completedBatches.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Total Batches
                </span>
                <span className="text-sm font-medium">{workflowBatches.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Total Tasks
                </span>
                <span className="text-sm font-medium">{totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-sm font-medium">
                  {new Date(workflow.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batches List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all">All Batches ({workflowBatches.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({availableBatches.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressBatches.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BatchList batches={workflowBatches} />
          </TabsContent>
          <TabsContent value="available">
            <BatchList batches={availableBatches} />
          </TabsContent>
          <TabsContent value="in-progress">
            <BatchList batches={inProgressBatches} />
          </TabsContent>
          <TabsContent value="completed">
            <BatchList batches={completedBatches} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

function BatchList({ batches }: { batches: typeof import("@/lib/dummy-data").batches }) {
  if (batches.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No batches found</p>
        </CardContent>
      </Card>
    )
  }

  // Sort by priority (highest first)
  const sortedBatches = [...batches].sort((a, b) => b.priority - a.priority)

  return (
    <div className="space-y-3">
      {sortedBatches.map((batch) => (
        <Card key={batch.id} className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <PriorityBadge priority={batch.priority} />
                  <h4 className="font-medium text-foreground truncate">{batch.title}</h4>
                  <StatusBadge status={batch.status} className="text-[10px]" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {batch.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 max-w-xs">
                    <Progress
                      value={(batch.tasksCompleted / batch.tasksTotal) * 100}
                      className="h-1.5"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {batch.tasksCompleted}/{batch.tasksTotal} tasks
                  </span>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href={`/dashboard/batches/${batch.id}`}>
                  {batch.status === "available" ? "Start" : 
                   batch.status === "in-progress" ? "Continue" : "View"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
