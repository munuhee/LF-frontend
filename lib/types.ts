export type UserRole = 'annotator' | 'reviewer' | 'admin'

export type WorkflowType =
  | 'agentic-ai' | 'llm-training' | 'multimodal' | 'evaluation'
  | 'benchmarking' | 'preference-ranking' | 'red-teaming' | 'data-collection'

export type TaskType = WorkflowType

export type BatchStatus = 'available' | 'in-progress' | 'completed' | 'pending-review'

export type TaskStatus =
  | 'unclaimed' | 'in-progress' | 'paused' | 'submitted'
  | 'approved' | 'rejected' | 'revision-requested'

export type BadgeType = 'role' | 'expertise' | 'level'

export interface Badge {
  type: BadgeType
  name: string
  description: string
  awardedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  isActive?: boolean
  badges?: Badge[]
  createdAt?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  type: WorkflowType
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
  instructions?: string
  taskType: TaskType
  priority: number
  workloadEstimate: number
  status: BatchStatus
  tasksTotal: number
  tasksCompleted: number
  deadline?: string
  createdAt: string
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
  priority: number
  externalUrl?: string
  estimatedDuration: number
  actualDuration?: number
  annotatorId?: string
  annotatorEmail?: string
  reviewerId?: string
  reviewerEmail?: string
  feedback?: string
  qualityScore?: number
  notes?: string
  submissionData?: Record<string, unknown>
  screenshots?: string[]
  startedAt?: string
  completedAt?: string
  submittedAt?: string
  createdAt?: string
  review?: TaskReview | null
}

export interface TaskReview {
  id: string
  status: string
  decision?: string
  comments?: string
  qualityScore?: number
  criteriaScores?: { accuracy: number; completeness: number; adherence: number }
  reviewerName?: string
  reviewedAt?: string
}

export interface Review {
  id: string
  taskId: string
  taskTitle: string
  batchId: string
  batchTitle: string
  workflowId?: string
  annotatorId: string
  annotatorEmail: string
  annotatorName: string
  reviewerId?: string
  reviewerEmail?: string
  reviewerName?: string
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'revision-requested'
  decision?: 'approve' | 'reject' | 'request-rework' | 'escalate' | 'hold' | 'flag'
  comments?: string
  reasonCode?: string
  qualityScore?: number
  criteriaScores?: { accuracy: number; completeness: number; adherence: number }
  submittedAt: string
  reviewedAt?: string
}

export interface Notification {
  id: string
  userId?: string
  type: 'batch-assigned' | 'task-approved' | 'task-rejected' | 'review-needed' | 'priority-warning' | 'system' | 'escalation' | 'deadline'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

export type Priority = number

export function priorityToLabel(priority: Priority): string {
  if (priority >= 0.9) return 'P0'
  if (priority >= 0.7) return 'P1'
  if (priority >= 0.5) return 'P2'
  if (priority >= 0.3) return 'P3'
  return 'P4'
}

export function priorityToColor(priority: Priority): string {
  if (priority >= 0.9) return 'bg-destructive text-destructive-foreground'
  if (priority >= 0.7) return 'bg-orange-500 text-white'
  if (priority >= 0.5) return 'bg-yellow-500 text-black'
  if (priority >= 0.3) return 'bg-blue-500 text-white'
  return 'bg-muted text-muted-foreground'
}
