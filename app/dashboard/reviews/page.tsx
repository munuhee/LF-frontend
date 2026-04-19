"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  MessageSquare,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { reviews, currentUser } from "@/lib/dummy-data"

type ReviewStatus = "pending" | "in-review" | "approved" | "rejected" | "revision-requested"

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all")
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  const isReviewer = currentUser.role === "reviewer" || currentUser.role === "admin"
  
  const myReviews = isReviewer 
    ? reviews 
    : reviews.filter(r => r.annotatorId === currentUser.id)

  const filteredReviews = myReviews.filter((review) => {
    return statusFilter === "all" || review.status === statusFilter
  })

  const pendingReviews = filteredReviews.filter(r => r.status === "pending")
  const inProgressReviews = filteredReviews.filter(r => r.status === "in-review")
  const approvedReviews = filteredReviews.filter(r => r.status === "approved")
  const rejectedReviews = filteredReviews.filter(r => ["rejected", "revision-requested"].includes(r.status))

  const getStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3.5 w-3.5 text-success" />
      case "rejected":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />
      case "revision-requested":
        return <AlertTriangle className="h-3.5 w-3.5 text-warning" />
      case "in-review":
        return <Clock className="h-3.5 w-3.5 text-blue-400" />
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20"
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "revision-requested":
        return "bg-warning/10 text-warning border-warning/20"
      case "in-review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <>
      <TopBar 
        title="Reviews" 
        subtitle={isReviewer ? "Review submitted tasks" : "Track your submission reviews"}
      />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{pendingReviews.length}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{inProgressReviews.length}</p>
                  <p className="text-[10px] text-muted-foreground">In Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{approvedReviews.length}</p>
                  <p className="text-[10px] text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{rejectedReviews.length}</p>
                  <p className="text-[10px] text-muted-foreground">Needs Action</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus | "all")}>
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

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger value="all" className="text-xs">All ({filteredReviews.length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Approved ({approvedReviews.length})</TabsTrigger>
            <TabsTrigger value="action" className="text-xs">Needs Action ({rejectedReviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ReviewList 
              reviews={filteredReviews} 
              getStatusIcon={getStatusIcon} 
              getStatusColor={getStatusColor} 
              isReviewer={isReviewer}
              expandedFeedback={expandedFeedback}
              setExpandedFeedback={setExpandedFeedback}
            />
          </TabsContent>
          <TabsContent value="pending">
            <ReviewList 
              reviews={pendingReviews} 
              getStatusIcon={getStatusIcon} 
              getStatusColor={getStatusColor} 
              isReviewer={isReviewer}
              expandedFeedback={expandedFeedback}
              setExpandedFeedback={setExpandedFeedback}
            />
          </TabsContent>
          <TabsContent value="approved">
            <ReviewList 
              reviews={approvedReviews} 
              getStatusIcon={getStatusIcon} 
              getStatusColor={getStatusColor} 
              isReviewer={isReviewer}
              expandedFeedback={expandedFeedback}
              setExpandedFeedback={setExpandedFeedback}
            />
          </TabsContent>
          <TabsContent value="action">
            <ReviewList 
              reviews={rejectedReviews} 
              getStatusIcon={getStatusIcon} 
              getStatusColor={getStatusColor} 
              isReviewer={isReviewer}
              expandedFeedback={expandedFeedback}
              setExpandedFeedback={setExpandedFeedback}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

interface ReviewListProps {
  reviews: typeof import("@/lib/dummy-data").reviews
  getStatusIcon: (status: ReviewStatus) => React.ReactNode
  getStatusColor: (status: ReviewStatus) => string
  isReviewer: boolean
  expandedFeedback: string | null
  setExpandedFeedback: (id: string | null) => void
}

function ReviewList({ reviews, getStatusIcon, getStatusColor, isReviewer, expandedFeedback, setExpandedFeedback }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">No reviews found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <Card key={review.id} className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className={`p-1.5 rounded-lg ${getStatusColor(review.status as ReviewStatus).split(" ")[0]}`}>
                {getStatusIcon(review.status as ReviewStatus)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link 
                    href={`/dashboard/tasks/${review.taskId}`}
                    className="font-medium text-foreground hover:text-primary truncate text-sm"
                  >
                    {review.taskTitle}
                  </Link>
                  <Badge variant="outline" className={`${getStatusColor(review.status as ReviewStatus)} text-[10px]`}>
                    {review.status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{review.batchTitle}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isReviewer ? review.annotatorName : (review.reviewerName || "Pending")}
                </span>
                <span>{new Date(review.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                {review.qualityScore && (
                  <span className="font-medium text-success">{review.qualityScore}%</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button size="sm" className="h-7 text-xs px-2.5" asChild>
                  <Link href={`/dashboard/tasks/${review.taskId}`}>View</Link>
                </Button>
                {isReviewer && review.status === "pending" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">Review</Button>
                )}
                {!isReviewer && review.status === "revision-requested" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">Revise</Button>
                )}
              </div>
            </div>

            {/* Feedback (collapsible) */}
            {review.feedback && (
              <Collapsible 
                open={expandedFeedback === review.id}
                onOpenChange={(open) => setExpandedFeedback(open ? review.id : null)}
              >
                <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground">
                  {expandedFeedback === review.id ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Feedback
                  {review.criteriaScores && (
                    <span className="ml-2 text-[10px]">
                      (Acc: {review.criteriaScores.accuracy}% | Comp: {review.criteriaScores.completeness}% | Adh: {review.criteriaScores.adherence}%)
                    </span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
                    {review.feedback}
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
