'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/top-bar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Batch } from '@/lib/types'

interface WorkflowDetail {
  id: string
  name: string
  type: string
  isActive: boolean
  batches: Batch[]
}

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.workflows.get(id)
      .then(setWorkflow)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleStartRandomTask = async (batchId: string) => {
    const tasks = await api.tasks.list({ batchId, status: 'unclaimed' })
    if (!tasks.length) return
    const task = tasks[Math.floor(Math.random() * tasks.length)]
    await api.tasks.action(task.id, 'claim')
    window.location.href = `/dashboard/tasks/${task.id}`
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Loading..." />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <TopBar title="Workflow" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        </main>
      </>
    )
  }

  if (!workflow) {
    return (
      <>
        <TopBar title="Workflow Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
            <Button asChild><Link href="/dashboard/workflows">Back to Work</Link></Button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={workflow.name} subtitle={`Workflow ${workflow.id}`} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/dashboard/workflows" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Work
          </Link>
        </Button>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Batches</h2>

          {workflow.batches.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No batches available in this workflow</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflow.batches.map(batch => (
                <Card key={batch.id} className="border-border bg-card hover:bg-card/80 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-foreground">{batch.title}</h3>
                        <span className="text-sm text-muted-foreground">{batch.tasksTotal} tasks</span>
                      </div>
                      {user?.role === 'annotator' && (
                        <Button
                          onClick={() => handleStartRandomTask(batch.id)}
                          className="gap-2 flex-shrink-0"
                        >
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
