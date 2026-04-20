"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ListTodo } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/top-bar"
import { PriorityBadge } from "@/components/status-badge"
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

  const totalTasks = workflowBatches.reduce((sum, b) => sum + b.tasksTotal, 0)

  return (
    <>
      <TopBar title={workflow.name} subtitle={`Workflow ${workflow.id}`} />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/dashboard/workflows" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>

        {/* Workflow Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListTodo className="h-4 w-4" />
              {totalTasks} total tasks across {workflowBatches.length} batches
            </span>
          </div>
        </div>

        {/* Batches List */}
        <div className="space-y-3">
          <BatchList batches={workflowBatches} />
        </div>
      </main>
    </>
  )
}

function BatchList({ batches }: { batches: typeof import("@/lib/dummy-data").batches }) {
  if (batches.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No batches found for this workflow</p>
        </CardContent>
      </Card>
    )
  }

  // Sort by priority (highest first), then by title
  const sortedBatches = [...batches].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.title.localeCompare(b.title)
  })

  return (
    <div className="space-y-3">
      {sortedBatches.map((batch) => (
        <Link
          key={batch.id}
          href={`/dashboard/batches/${batch.id}`}
          className="block group"
        >
          <Card className="border-border bg-card hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <PriorityBadge priority={batch.priority} />
                    <h4 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors truncate">
                      {batch.title}
                    </h4>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {batch.description}
                  </p>

                  <div className="flex items-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" />
                      {batch.tasksTotal} tasks
                    </span>
                  </div>
                </div>

                {/* Subtle arrow indicator */}
                <div className="flex-shrink-0 self-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
