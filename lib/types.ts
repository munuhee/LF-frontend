export type UserRole = 'annotator' | 'reviewer' | 'admin'

export type WorkflowType =
  | 'agentic-ai' | 'llm-training' | 'multimodal' | 'evaluation'
  | 'benchmarking' | 'preference-ranking' | 'red-teaming' | 'data-collection'

export type TaskType = WorkflowType

export type BatchStatus = 'available' | 'in-progress' | 'completed' | 'pending-review'

export type TaskStatus =
  | 'unclaimed' | 'in-progress' | 'paused' | 'submitted' | 'in-review'
  | 'approved' | 'rejected' | 'revision-requested' | 'escalated' | 'data-ready'

export type ErrorSeverity = 'major' | 'minor'

export const MAJOR_ERROR_CATEGORIES = [
  { value: 'task-not-completed',    label: 'Task Not Completed Correctly' },
  { value: 'logical-inconsistency', label: 'Logical Inconsistency in Steps' },
  { value: 'missing-critical-step', label: 'Missing Critical Steps' },
  { value: 'fabricated-results',    label: 'Fabricated or Unsupported Results' },
  { value: 'wrong-navigation',      label: 'Completely Wrong Navigation Path' },
  { value: 'invalid-data-capture',  label: 'Missing or Invalid Data Capture' },
  { value: 'instruction-violation', label: 'Failure to Follow Instructions' },
] as const

export const MINOR_ERROR_CATEGORIES = [
  { value: 'inefficient-workflow',    label: 'Inefficient Workflow' },
  { value: 'poor-clarity',           label: 'Poor Clarity in Reasoning' },
  { value: 'missing-minor-context',  label: 'Missing Minor Context' },
  { value: 'timing-irregularity',    label: 'Timing Irregularity' },
  { value: 'mislabeling',            label: 'Mislabeling of Actions' },
  { value: 'low-quality-screenshot', label: 'Low-Quality Screenshots' },
] as const

export type MajorErrorCategory = typeof MAJOR_ERROR_CATEGORIES[number]['value']
export type MinorErrorCategory = typeof MINOR_ERROR_CATEGORIES[number]['value']
export type ErrorCategory = MajorErrorCategory | MinorErrorCategory

export const ERROR_CATEGORIES: Record<ErrorSeverity, readonly { value: string; label: string }[]> = {
  major: MAJOR_ERROR_CATEGORIES,
  minor: MINOR_ERROR_CATEGORIES,
}

export interface ErrorTag {
  tagId: string
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  stepReference?: string
  scoreDeduction: number
  status: 'open' | 'resolved'
  createdBy: string
  createdByEmail: string
  resolvedBy?: string
  resolvedAt?: string
}

export interface ActivityEntry {
  action: string
  userId: string
  userEmail: string
  comment?: string
  timestamp: string
}

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
  assignedUsers?: string[]
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

export interface TaskSubtask {
  id: string
  title: string
  description?: string
  completed?: boolean
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
  isLocked?: boolean
  priority: number
  difficulty?: 'easy' | 'medium' | 'hard'
  languageTags?: string[]
  sla?: string
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
  objective?: string
  successCriteria?: string[]
  expectedOutput?: Record<string, unknown>
  subtasks?: TaskSubtask[]
  submissionData?: Record<string, unknown>
  extensionData?: Record<string, unknown>
  screenshots?: string[]
  errorTags?: ErrorTag[]
  activityLog?: ActivityEntry[]
  startedAt?: string
  completedAt?: string
  submittedAt?: string
  signedOffAt?: string
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
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'revision-requested' | 'escalated' | 'on-hold' | 'flagged' | 'data-ready'
  decision?: 'approve' | 'reject' | 'request-rework' | 'escalate' | 'hold' | 'flag'
  comments?: string
  reasonCode?: string
  qualityScore?: number
  criteriaScores?: { accuracy: number; completeness: number; adherence: number }
  submittedAt: string
  reviewedAt?: string
  errorTags?: ErrorTag[]
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
