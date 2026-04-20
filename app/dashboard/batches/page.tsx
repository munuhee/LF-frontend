"use client"
import { useState } from "react"
import Link from "next/link"
import { Filter, Workflow, ListTodo } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { PriorityBadge, TaskTypeBadge, StatusBadge } from "@/components/status-badge"
import { batches, defaultUser } from "@/lib/dummy-data"
import { useAuth } from "@/lib/auth-context"
import type { BatchStatus } from "@/lib/types"

export default function BatchesPage() {
  const { user } = useAuth()
  const currentUser = user || defaultUser

  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "all">("all")

  const filteredBatches = batches.filter((batch) => {
    const matchesType = taskTypeFilter === "all" || batch.taskType === taskTypeFilter
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesType && matchesStatus
  })

  const sortedBatches = [...filteredBatches].sort((a, b) => b.priority - a.priority)

  const completedBatches = sortedBatches.filter(b => b.status === "completed")

  return (
    <>
      <TopBar title="Batches" subtitle="Browse and manage your work assignments" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
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
            <TabsTrigger value="completed" className="text-xs">Completed ({completedBatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BatchList batches={sortedBatches} />
          </TabsContent>

          <TabsContent value="completed">
            <BatchList batches={completedBatches} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

interface BatchListProps {
  batches: typeof import("@/lib/dummy-data").batches
}

function BatchList({ batches }: BatchListProps) {
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
        <Card
          key={batch.id}
          className="border-border bg-card hover:bg-card/80 transition-colors"
        >
          <CardContent className="p-3"> {/* Reduced from p-4 */}
            <div className="flex items-start gap-3"> {/* Reduced gap from 4 to 3 */}
              {/* Priority */}
              <PriorityBadge priority={batch.priority} className="w-8 justify-center mt-0.5" />

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"> {/* Tighter margin */}
                  <Link
                    href={`/dashboard/batches/${batch.id}`}
                    className="font-medium text-foreground hover:text-primary truncate text-[15px] leading-tight"
                  >
                    {batch.title}
                  </Link>
                  <TaskTypeBadge type={batch.taskType} className="text-[10px] px-1.5 py-0 shrink-0" />
                </div>

                {/* Workflow */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5"> {/* Reduced margin */}
                  <Workflow className="h-3 w-3" />
                  <Link
                    href={`/dashboard/workflows/${batch.workflowId}`}
                    className="hover:text-primary truncate"
                  >
                    {batch.workflowName}
                  </Link>
                </div>

                {/* Task Count */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ListTodo className="h-4 w-4" />
                  <span>{batch.tasksTotal} tasks</span>
                </div>
              </div>

              {/* Right Side Meta */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0"> {/* Slightly tighter gap */}
                {batch.status === "completed" && (
                  <StatusBadge status={batch.status} className="text-[10px]" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
