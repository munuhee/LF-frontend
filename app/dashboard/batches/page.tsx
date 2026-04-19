"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { StatusBadge, PriorityBadge, TaskTypeBadge } from "@/components/status-badge"
import { batches } from "@/lib/dummy-data"
import type { BatchStatus } from "@/lib/types"

export default function BatchesPage() {
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all")

  const filteredBatches = batches.filter((batch) => {
    const matchesType = taskTypeFilter === "all" || batch.taskType === taskTypeFilter
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesType && matchesStatus
  })

  // Sort by priority (highest first)
  const sortedBatches = [...filteredBatches].sort((a, b) => b.priority - a.priority)

  const availableBatches = sortedBatches.filter(b => b.status === "available")
  const inProgressBatches = sortedBatches.filter(b => b.status === "in-progress")
  const completedBatches = sortedBatches.filter(b => b.status === "completed")

  return (
    <>
      <TopBar title="Batches" subtitle="Browse and manage your work assignments" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Task Type" />
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BatchStatus | "all")}>
            <SelectTrigger className="w-[140px] bg-card border-border h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger value="all" className="text-xs">All ({sortedBatches.length})</TabsTrigger>
            <TabsTrigger value="available" className="text-xs">Available ({availableBatches.length})</TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">In Progress ({inProgressBatches.length})</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Completed ({completedBatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BatchList batches={sortedBatches} />
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
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">No batches found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {batches.map((batch) => (
        <Card key={batch.id} className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Priority */}
              <PriorityBadge priority={batch.priority} className="w-8 justify-center" />
              
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link 
                    href={`/dashboard/batches/${batch.id}`}
                    className="font-medium text-foreground hover:text-primary truncate text-sm"
                  >
                    {batch.title}
                  </Link>
                  <TaskTypeBadge type={batch.taskType} className="text-[10px] px-1.5 py-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {batch.description}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 flex-shrink-0 w-32">
                <div className="flex-1">
                  <Progress
                    value={(batch.tasksCompleted / batch.tasksTotal) * 100}
                    className="h-1.5"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {batch.tasksCompleted}/{batch.tasksTotal}
                </span>
              </div>

              {/* Meta & Status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(batch.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {batch.workloadEstimate}h
                </span>
                <StatusBadge status={batch.status} className="text-[10px]" />
              </div>

              {/* Action */}
              <Button size="sm" className="h-7 text-xs px-2.5 flex-shrink-0" asChild>
                <Link href={`/dashboard/batches/${batch.id}`}>
                  {batch.status === "available" ? "Start" : 
                   batch.status === "in-progress" ? "Continue" : "View"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
