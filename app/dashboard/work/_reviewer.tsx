'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TopBar } from '@/components/top-bar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Review } from '@/lib/types'

const statusColor: Record<string, string> = {
  'approved': 'bg-success/10 text-success border-success/20',
  'rejected': 'bg-destructive/10 text-destructive border-destructive/20',
  'revision-requested': 'bg-warning/10 text-warning border-warning/20',
  'in-review': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'escalated': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'on-hold': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'flagged': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function ReviewerWork() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.reviews.list()
      .then(setReviews)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const mine = reviews.filter(r => r.reviewerId === user?.id)
  const active = mine.filter(r => r.status === 'in-review')
  const done = mine.filter(r => !['pending', 'in-review'].includes(r.status))

  const ReviewRow = ({ review }: { review: Review }) => (
    <Card className="border-border bg-card">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{review.taskTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{review.batchTitle} · By {review.annotatorName}</p>
          {review.reviewedAt && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Reviewed {new Date(review.reviewedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {review.qualityScore && (
          <span className="text-sm font-medium text-success shrink-0">{review.qualityScore}%</span>
        )}
        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor[review.status] || ''}`}>
          {review.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </Badge>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 shrink-0" asChild>
          <Link href={`/dashboard/tasks/${review.taskId}`}>View</Link>
        </Button>
      </CardContent>
    </Card>
  )

  const Empty = ({ label }: { label: string }) => (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )

  return (
    <>
      <TopBar title="Work" subtitle="Your review activity" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="bg-card border border-border h-9">
              <TabsTrigger value="active" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />In Progress ({active.length})
              </TabsTrigger>
              <TabsTrigger value="done" className="gap-1.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5" />Completed ({done.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <div className="space-y-2">
                {active.length ? active.map(r => <ReviewRow key={r.id} review={r} />) : <Empty label="No active reviews" />}
              </div>
            </TabsContent>
            <TabsContent value="done">
              <div className="space-y-2">
                {done.length ? done.map(r => <ReviewRow key={r.id} review={r} />) : <Empty label="No completed reviews yet" />}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  )
}
