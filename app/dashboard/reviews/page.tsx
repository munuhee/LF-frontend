'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Filter,
  MessageSquare, User, ChevronDown, ChevronRight, AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TopBar } from '@/components/top-bar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { Review } from '@/lib/types'

type ReviewStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'revision-requested' | 'escalated' | 'on-hold' | 'flagged'
type ReviewDecision = 'approve' | 'reject' | 'request-rework' | 'escalate' | 'hold' | 'flag'

export default function ReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [decideReview, setDecideReview] = useState<Review | null>(null)
  const [decision, setDecision] = useState<ReviewDecision>('approve')
  const [comments, setComments] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [qualityScore, setQualityScore] = useState<number>(85)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [atTaskLimit, setAtTaskLimit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin'

  useEffect(() => {
    if (!user) return
    api.reviews.list()
      .then(data => {
        setReviews(data)
        const active = data.filter((r: Review) => r.status === 'in-review' && r.reviewerId === user.id)
        setAtTaskLimit(isReviewer && active.length >= 2)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [user])

  const filtered = reviews.filter(r => {
    const mine = isReviewer
      ? r.status !== 'in-review' || r.reviewerId === user?.id
      : r.annotatorId === user?.id
    return mine && (statusFilter === 'all' || r.status === statusFilter)
  })

  const handleClaim = async (review: Review) => {
    try {
      const updated = await api.reviews.claim(review.id)
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, ...updated } : r))
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message)
    }
  }

  const handleDecide = async () => {
    if (!decideReview) return
    setIsSubmitting(true)
    try {
      const updated = await api.reviews.decide(decideReview.id, {
        decision, comments, reasonCode,
        qualityScore: decision === 'approve' ? qualityScore : undefined,
        criteriaScores: decision === 'approve' ? { accuracy: qualityScore, completeness: qualityScore, adherence: qualityScore } : undefined,
      })
      setReviews(prev => prev.map(r => r.id === decideReview.id ? { ...r, ...updated } : r))
      setDecideReview(null)
      setComments('')
    } catch { /* noop */ }
    finally { setIsSubmitting(false) }
  }

  const statusIcon = (s: ReviewStatus) => {
    if (s === 'approved') return <CheckCircle className="h-3.5 w-3.5 text-success" />
    if (s === 'rejected') return <XCircle className="h-3.5 w-3.5 text-destructive" />
    if (s === 'revision-requested') return <AlertTriangle className="h-3.5 w-3.5 text-warning" />
    if (s === 'in-review') return <Clock className="h-3.5 w-3.5 text-blue-400" />
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const statusColor = (s: ReviewStatus) => {
    if (s === 'approved') return 'bg-success/10 text-success border-success/20'
    if (s === 'rejected') return 'bg-destructive/10 text-destructive border-destructive/20'
    if (s === 'revision-requested') return 'bg-warning/10 text-warning border-warning/20'
    if (s === 'in-review') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (s === 'escalated') return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    if (s === 'on-hold') return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (s === 'flagged') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    return 'bg-muted text-muted-foreground border-border'
  }

  const pending = filtered.filter(r => r.status === 'pending')
  const approved = filtered.filter(r => r.status === 'approved')
  const needsAction = filtered.filter(r => ['rejected', 'revision-requested'].includes(r.status))

  const ReviewCard = ({ review }: { review: Review }) => (
    <Card key={review.id} className="border-border bg-card">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${statusColor(review.status as ReviewStatus).split(' ')[0]}`}>
            {statusIcon(review.status as ReviewStatus)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Link href={`/dashboard/tasks/${review.taskId}`} className="font-medium text-sm text-foreground hover:text-primary truncate">
                {review.taskTitle}
              </Link>
              <Badge variant="outline" className={`${statusColor(review.status as ReviewStatus)} text-[10px]`}>
                {review.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{review.batchTitle}</p>
            {isReviewer && <p className="text-[10px] text-muted-foreground mt-0.5">By: {review.annotatorEmail}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {isReviewer ? review.annotatorName : (review.reviewerName || 'Pending')}
            </span>
            <span>{new Date(review.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            {review.qualityScore && <span className="font-medium text-success">{review.qualityScore}%</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" className="h-7 text-xs px-2.5" asChild>
              <Link href={`/dashboard/tasks/${review.taskId}`}>View</Link>
            </Button>
            {isReviewer && review.status === 'pending' && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2.5"
                disabled={atTaskLimit} onClick={() => handleClaim(review)}>
                Claim
              </Button>
            )}
            {isReviewer && review.status === 'in-review' && review.reviewerId === user?.id && (
              <Button size="sm" className="h-7 text-xs px-2.5"
                onClick={() => { setDecideReview(review); setDecision('approve') }}>
                Decide
              </Button>
            )}
            {!isReviewer && review.status === 'revision-requested' && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" asChild>
                <Link href={`/dashboard/tasks/${review.taskId}`}>Revise</Link>
              </Button>
            )}
          </div>
        </div>
        {review.comments && (
          <Collapsible open={expandedFeedback === review.id} onOpenChange={open => setExpandedFeedback(open ? review.id : null)}>
            <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground">
              {expandedFeedback === review.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Feedback
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">{review.comments}</div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )

  const EmptyState = () => (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center justify-center py-8">
        <p className="text-muted-foreground text-sm">No reviews found</p>
      </CardContent>
    </Card>
  )

  return (
    <>
      <TopBar title="Reviews" subtitle={isReviewer ? 'Review submitted tasks' : 'Track your submission reviews'} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isReviewer && atTaskLimit && (
          <Alert className="mb-4 border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              You have reached the maximum of 2 active reviews. Complete one before claiming more.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Pending', count: pending.length, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
            { label: 'My Active', count: filtered.filter(r => r.status === 'in-review').length, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Approved', count: approved.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Needs Action', count: needsAction.length, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
          ].map(s => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.count}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ReviewStatus | 'all')}>
            <SelectTrigger className="w-[160px] bg-card border-border h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revision-requested">Revision Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <Tabs defaultValue="all" className="space-y-3">
            <TabsList className="bg-card border border-border h-9">
              <TabsTrigger value="all" className="text-xs">All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="action" className="text-xs">Needs Action ({needsAction.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="space-y-2">{filtered.length ? filtered.map(r => <ReviewCard key={r.id} review={r} />) : <EmptyState />}</div>
            </TabsContent>
            <TabsContent value="pending">
              <div className="space-y-2">{pending.length ? pending.map(r => <ReviewCard key={r.id} review={r} />) : <EmptyState />}</div>
            </TabsContent>
            <TabsContent value="approved">
              <div className="space-y-2">{approved.length ? approved.map(r => <ReviewCard key={r.id} review={r} />) : <EmptyState />}</div>
            </TabsContent>
            <TabsContent value="action">
              <div className="space-y-2">{needsAction.length ? needsAction.map(r => <ReviewCard key={r.id} review={r} />) : <EmptyState />}</div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Decision Dialog */}
      <Dialog open={!!decideReview} onOpenChange={open => { if (!open) setDecideReview(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Decision</DialogTitle>
            <DialogDescription>{decideReview?.taskTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Decision</Label>
              <Select value={decision} onValueChange={v => setDecision(v as ReviewDecision)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="request-rework">Request Rework</SelectItem>
                  <SelectItem value="escalate">Escalate</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="flag">Flag for Investigation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {decision === 'approve' && (
              <div>
                <Label className="text-xs mb-2 block">Quality Score ({qualityScore}%)</Label>
                <input type="range" min={0} max={100} value={qualityScore}
                  onChange={e => setQualityScore(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            )}
            <div>
              <Label className="text-xs mb-2 block">Reason Code (optional)</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-quality">High Quality Work</SelectItem>
                  <SelectItem value="incomplete">Incomplete Task</SelectItem>
                  <SelectItem value="inaccurate">Inaccurate Data</SelectItem>
                  <SelectItem value="format-error">Format Error</SelectItem>
                  <SelectItem value="policy-violation">Policy Violation</SelectItem>
                  <SelectItem value="needs-clarification">Needs Clarification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Comments</Label>
              <Textarea
                placeholder="Add review comments..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="min-h-[100px] bg-secondary/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecideReview(null)}>Cancel</Button>
            <Button onClick={handleDecide} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
