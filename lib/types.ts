export type UserRole = "annotator" | "reviewer" | "admin"

export type WorkflowType =
  | "agentic-ai"
  | "llm-training"
  | "multimodal"
  | "evaluation"
  | "benchmarking"
  | "preference-ranking"
  | "red-teaming"
  | "data-collection"

export type TaskType = WorkflowType

export type BatchStatus = "available" | "in-progress" | "completed" | "pending-review"

export type TaskStatus =
  | "unclaimed"
  | "in-progress"
  | "paused"
  | "submitted"
  | "approved"
  | "rejected"
  | "revision-requested"

// Priority as decimal 0-1 (0 = lowest, 1 = highest)
// Display format: P0 (highest) to P4 (lowest)
export type Priority = number

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  joinedAt: string
  // Test credentials for testing flows
  testPassword?: string
  testOtp?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  type: WorkflowType
  priority: Priority
  isActive: boolean
  batchCount: number
  taskCount: number
  createdAt: string
}

export interface Batch {
  id: string
  workflowId: string
  workflowName: string
  title: string
  description: string
  taskType: TaskType
  priority: Priority // 0-1 decimal
  workloadEstimate: number
  status: BatchStatus
  tasksTotal: number
  tasksCompleted: number
  createdAt: string
  // Admin only - not visible to annotators/reviewers
  assignedAnnotatorCount?: number
}

export interface Task {
  id: string
  batchId: string
  batchTitle: string
  workflowId: string
  workflowName: string
  title: string
  description: string
  taskType: TaskType
  status: TaskStatus
  priority: Priority // 0-1 decimal
  externalUrl?: string
  estimatedDuration: number
  actualDuration?: number
  startedAt?: string
  completedAt?: string
  submittedAt?: string
  // Task ownership
  annotatorId?: string
  annotatorEmail?: string
  reviewerId?: string
  reviewerEmail?: string
  feedback?: string
  qualityScore?: number
  // Extension data (from browser extension)
  extensionData?: {
    activityData?: Record<string, unknown>
    screenshots?: string[]
    totalToolUsageMinutes?: number
  }
}

export interface Review {
  id: string
  taskId: string
  taskTitle: string
  batchId: string
  batchTitle: string
  annotatorId: string
  annotatorEmail: string
  annotatorName: string
  reviewerId?: string
  reviewerEmail?: string
  reviewerName?: string
  status: "pending" | "in-review" | "approved" | "rejected" | "revision-requested"
  submittedAt: string
  reviewedAt?: string
  qualityScore?: number
  feedback?: string
  criteriaScores?: {
    accuracy: number
    completeness: number
    adherence: number
  }
}

export interface Notification {
  id: string
  type: "batch-assigned" | "task-approved" | "task-rejected" | "review-needed" | "priority-warning" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface DashboardStats {
  availableBatches: number
  activeTasks: number
  completedTasks: number
  signedOffTasks: number
  pendingReviews: number
  averageQualityScore: number
}

export interface AdminStats {
  totalAnnotators: number
  totalReviewers: number
  totalTasksCompleted: number
  totalTasksPending: number
  averageTaskTime: number
  dailyToolUsageHours: number
}

export interface AnnotatorPerformance {
  id: string
  name: string
  email: string
  tasksCompleted: number
  averageQuality: number
  averageTimeMinutes: number
  totalToolUsageHours: number
}

export interface ReviewerActivity {
  id: string
  name: string
  email: string
  reviewsCompleted: number
  averageReviewTime: number
  approvalRate: number
}

export interface AnalyticsData {
  tasksCompletedByDay: { date: string; count: number }[]
  tasksByType: { type: TaskType; count: number }[]
  qualityScoresTrend: { date: string; score: number }[]
  annotatorPerformance: AnnotatorPerformance[]
  reviewerActivity: ReviewerActivity[]
}

// Helper to convert decimal priority to display format (P0-P4)
export function priorityToLabel(priority: Priority): string {
  if (priority >= 0.9) return "P0"
  if (priority >= 0.7) return "P1"
  if (priority >= 0.5) return "P2"
  if (priority >= 0.3) return "P3"
  return "P4"
}

// Helper to get priority color class
export function priorityToColor(priority: Priority): string {
  if (priority >= 0.9) return "bg-destructive text-destructive-foreground"
  if (priority >= 0.7) return "bg-orange-500 text-white"
  if (priority >= 0.5) return "bg-yellow-500 text-black"
  if (priority >= 0.3) return "bg-blue-500 text-white"
  return "bg-muted text-muted-foreground"
}

// Helper to check if reviewer has reached task limit
export function isReviewerAtTaskLimit(reviewerId: string, activeReviews: Review[]): boolean {
  const activeCount = activeReviews.filter(
    r => r.reviewerId === reviewerId && r.status === "in-review"
  ).length
  return activeCount >= 2
}
