"use client"

import { useState } from "react"
import Link from "next/link"
import { Filter, Layers, ListTodo, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TopBar } from "@/components/top-bar"
import { PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { workflows, batches } from "@/lib/dummy-data"
import type { WorkflowType } from "@/lib/types"

export default function WorkflowsPage() {
  const [typeFilter, setTypeFilter] = useState<WorkflowType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesType = typeFilter === "all" || workflow.type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && workflow.isActive) ||
      (statusFilter === "inactive" && !workflow.isActive)
    return matchesType && matchesStatus
  })

  // Sort by priority (highest first)
  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => b.priority - a.priority)

  // Get batches for a workflow
  const getBatchesForWorkflow = (workflowId: string) => {
    return batches.filter(b => b.workflowId === workflowId)
  }

  return (
    <>
      <TopBar title="Workflows" subtitle="Browse available workflows and their batches" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as WorkflowType | "all")}>
            <SelectTrigger className="w-[160px] bg-card border-border h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="agentic-ai">Agentic AI</SelectItem>
              <SelectItem value="llm-training">LLM Training</SelectItem>
              <SelectItem value="multimodal">Multimodal</SelectItem>
              <SelectItem value="evaluation">Evaluation</SelectItem>
              <SelectItem value="benchmarking">Benchmarking</SelectItem>
              <SelectItem value="preference-ranking">Preference</SelectItem>
              <SelectItem value="red-teaming">Red Teaming</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-[140px] bg-card border-border h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Workflows Grid */}
        <div className="space-y-4">
          {sortedWorkflows.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No workflows found</p>
              </CardContent>
            </Card>
          ) : (
            sortedWorkflows.map((workflow) => {
              const workflowBatches = getBatchesForWorkflow(workflow.id)
              const activeBatches = workflowBatches.filter(b => b.status === "in-progress")
              const totalTasks = workflowBatches.reduce((sum, b) => sum + b.tasksTotal, 0)
              const completedTasks = workflowBatches.reduce((sum, b) => sum + b.tasksCompleted, 0)
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

              return (
                <Card key={workflow.id} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <PriorityBadge priority={workflow.priority} />
                          <TaskTypeBadge type={workflow.type} className="text-[10px]" />
                          {!workflow.isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription className="mt-1">{workflow.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{workflowBatches.length}</span>
                            <span className="text-muted-foreground">batches</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{totalTasks}</span>
                            <span className="text-muted-foreground">tasks</span>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/workflows/${workflow.id}`}>
                            View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {workflowBatches.length > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-medium">
                              {completedTasks} / {totalTasks} tasks ({Math.round(progress)}%)
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>

                        {/* Active Batches Preview */}
                        {activeBatches.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-2">Active Batches:</p>
                            <div className="flex flex-wrap gap-2">
                              {activeBatches.slice(0, 3).map((batch) => (
                                <Link
                                  key={batch.id}
                                  href={`/dashboard/batches/${batch.id}`}
                                  className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  {batch.title}
                                </Link>
                              ))}
                              {activeBatches.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{activeBatches.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Empty State for Workflows with No Batches */}
                        {workflowBatches.length === 0 && (
                          <div className="py-3 text-center text-sm text-muted-foreground">
                            No batches available yet
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}

                  {workflowBatches.length === 0 && (
                    <CardContent>
                      <div className="py-2 text-center text-sm text-muted-foreground border-t border-border">
                        No batches available yet
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </main>
    </>
  )
}
