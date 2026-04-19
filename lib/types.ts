export type UserRole = "annotator" | "reviewer" | "admin"

export type TaskType =
  | "agentic-ai"
  | "llm-training"
  | "multimodal"
  | "evaluation"
  | "benchmarking"
  | "preference-ranking"
  | "red-teaming"
  | "data-collection"

export type BatchStatus = "available" | "in-progress" | "completed" | "pending-review"

export type TaskStatus =
  | "not-started"
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
}

export interface Batch {
  id: string
  title: string
  description: string
  taskType: TaskType
  priority: Priority // 0-1 decimal
  deadline: string
  workloadEstimate: number
  status: BatchStatus
  tasksTotal: number
  tasksCompleted: number
  createdAt: string
  assignedTo?: string[]
}

export interface Task {
  id: string
  batchId: string
  batchTitle: string
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
  assignedTo: string
  reviewedBy?: string
  feedback?: string
  qualityScore?: number
}

export interface Session {
  id: string
  taskId: string
  taskTitle: string
  batchId: string
  batchTitle: string
  startTime: string
  endTime?: string
  duration: number
  status: "active" | "paused" | "completed"
  eventsRecorded: number
}

export interface Review {
  id: string
  taskId: string
  taskTitle: string
  batchId: string
  batchTitle: string
  annotatorId: string
  annotatorName: string
  reviewerId?: string
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
  type: "batch-assigned" | "task-approved" | "task-rejected" | "review-needed" | "deadline-warning" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface DashboardStats {
  availableBatches: number
  activeTasks: number
  completedSessions: number
  signedOffTasks: number
  pendingReviews: number
  averageQualityScore: number
}

export interface AnalyticsData {
  tasksCompletedByDay: { date: string; count: number }[]
  tasksByType: { type: TaskType; count: number }[]
  qualityScoresTrend: { date: string; score: number }[]
  annotatorPerformance: {
    id: string
    name: string
    tasksCompleted: number
    averageQuality: number
    averageTime: number
  }[]
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
