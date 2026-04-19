import type {
  User,
  Workflow,
  Batch,
  Task,
  Review,
  Notification,
  DashboardStats,
  AdminStats,
  AnalyticsData,
} from "./types"

// ============================================
// TEST USERS FOR DIFFERENT ROLES
// ============================================
// To test different roles, change currentUser to one of these:
// Annotators: testAnnotator1, testAnnotator2
// Reviewers: testReviewer1, testReviewer2
// Admins: testAdmin1, testAdmin2
// ============================================

// Annotators
export const testAnnotator1: User = {
  id: "usr_001",
  name: "Alex Chen",
  email: "alex.chen@labelforge.ai",
  role: "annotator",
  department: "AI Training",
  joinedAt: "2024-01-15",
  testPassword: "annotator123!",
  testOtp: "123456",
}

export const testAnnotator2: User = {
  id: "usr_004",
  name: "Emily Davis",
  email: "emily.davis@labelforge.ai",
  role: "annotator",
  department: "AI Training",
  joinedAt: "2024-02-01",
  testPassword: "annotator456!",
  testOtp: "234567",
}

// Reviewers
export const testReviewer1: User = {
  id: "usr_002",
  name: "Sarah Johnson",
  email: "sarah.johnson@labelforge.ai",
  role: "reviewer",
  department: "Quality Assurance",
  joinedAt: "2023-11-20",
  testPassword: "reviewer123!",
  testOtp: "345678",
}

export const testReviewer2: User = {
  id: "usr_006",
  name: "Maria Garcia",
  email: "maria.garcia@labelforge.ai",
  role: "reviewer",
  department: "Quality Assurance",
  joinedAt: "2024-01-10",
  testPassword: "reviewer456!",
  testOtp: "456789",
}

// Admins
export const testAdmin1: User = {
  id: "usr_003",
  name: "Michael Park",
  email: "michael.park@labelforge.ai",
  role: "admin",
  department: "Operations",
  joinedAt: "2023-06-10",
  testPassword: "admin123!",
  testOtp: "567890",
}

export const testAdmin2: User = {
  id: "usr_007",
  name: "Jennifer Lee",
  email: "jennifer.lee@labelforge.ai",
  role: "admin",
  department: "Operations",
  joinedAt: "2023-08-15",
  testPassword: "admin456!",
  testOtp: "678901",
}

// Additional annotator for testing
const additionalAnnotator: User = {
  id: "usr_005",
  name: "James Wilson",
  email: "james.wilson@labelforge.ai",
  role: "annotator",
  department: "AI Training",
  joinedAt: "2024-03-15",
  testPassword: "annotator789!",
  testOtp: "789012",
}

// CHANGE THIS TO TEST DIFFERENT ROLES
// Options: testAnnotator1, testAnnotator2, testReviewer1, testReviewer2, testAdmin1, testAdmin2
export const currentUser: User = testAnnotator1

export const users: User[] = [
  testAnnotator1,
  testAnnotator2,
  testReviewer1,
  testReviewer2,
  testAdmin1,
  testAdmin2,
  additionalAnnotator,
]

// Authentication helpers - only seeded credentials work
export function validateCredentials(email: string, password: string): User | null {
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.testPassword === password
  )
  return user || null
}

export function validateOtp(email: string, otp: string): User | null {
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.testOtp === otp
  )
  return user || null
}

// ============================================
// WORKFLOWS
// ============================================
// Hierarchy: Workflow -> Batches -> Tasks

export const workflows: Workflow[] = [
  {
    id: "wf_001",
    name: "Agentic AI Evaluation",
    description: "Evaluate and train agentic AI behaviors through complex task completion",
    type: "agentic-ai",
    isActive: true,
    batchCount: 2,
    taskCount: 80,
    createdAt: "2026-04-01",
  },
  {
    id: "wf_002",
    name: "LLM Training Data",
    description: "Generate high-quality training data for language model improvements",
    type: "llm-training",
    isActive: true,
    batchCount: 1,
    taskCount: 100,
    createdAt: "2026-04-05",
  },
  {
    id: "wf_003",
    name: "Multimodal Assessment",
    description: "Evaluate alignment between images, text, and other modalities",
    type: "multimodal",
    isActive: true,
    batchCount: 0,
    taskCount: 0,
    createdAt: "2026-04-08",
  },
  {
    id: "wf_004",
    name: "Red Teaming Initiative",
    description: "Identify vulnerabilities and safety issues in AI models",
    type: "red-teaming",
    isActive: true,
    batchCount: 1,
    taskCount: 30,
    createdAt: "2026-04-02",
  },
  {
    id: "wf_005",
    name: "Benchmarking Suite",
    description: "Compare model responses against baseline benchmarks",
    type: "benchmarking",
    isActive: true,
    batchCount: 0,
    taskCount: 0,
    createdAt: "2026-04-10",
  },
  {
    id: "wf_006",
    name: "Preference Ranking",
    description: "Rank model outputs based on helpfulness, accuracy, and safety",
    type: "preference-ranking",
    isActive: true,
    batchCount: 0,
    taskCount: 0,
    createdAt: "2026-04-03",
  },
  {
    id: "wf_007",
    name: "Code Evaluation",
    description: "Evaluate quality and correctness of generated code",
    type: "evaluation",
    isActive: true,
    batchCount: 0,
    taskCount: 0,
    createdAt: "2026-04-12",
  },
]

// Priority uses decimal 0-1, displayed as P0-P4
// P0 = 0.9-1.0 (highest/urgent)
// P1 = 0.7-0.89 (high)
// P2 = 0.5-0.69 (medium)
// P3 = 0.3-0.49 (low)
// P4 = 0-0.29 (lowest)

export const batches: Batch[] = [
  // Agentic AI Evaluation workflow batches (wf_001)
  {
    id: "batch_001",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Agent Task Completion - Web Navigation",
    description: "Complete complex multi-step tasks on external websites to train agentic AI behaviors",
    taskType: "agentic-ai",
    priority: 0.95,
    workloadEstimate: 40,
    status: "available",
    tasksTotal: 50,
    tasksCompleted: 0,
    createdAt: "2026-04-10",
    assignedAnnotatorCount: 5,
  },
  {
    id: "batch_008",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Agent Task Completion - E-commerce Flows",
    description: "Complete e-commerce tasks including product search, comparison, and checkout processes",
    taskType: "agentic-ai",
    priority: 0.9,
    workloadEstimate: 35,
    status: "in-progress",
    tasksTotal: 30,
    tasksCompleted: 12,
    createdAt: "2026-04-12",
    assignedAnnotatorCount: 3,
  },
  // LLM Training workflow batch (wf_002)
  {
    id: "batch_002",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Customer Support Response Training",
    description: "Generate and evaluate customer support responses for various scenarios",
    taskType: "llm-training",
    priority: 0.55,
    workloadEstimate: 25,
    status: "in-progress",
    tasksTotal: 100,
    tasksCompleted: 45,
    createdAt: "2026-04-08",
    assignedAnnotatorCount: 8,
  },
  // Red Teaming workflow batch (wf_004)
  {
    id: "batch_004",
    workflowId: "wf_004",
    workflowName: "Red Teaming Initiative",
    title: "Model Safety Red Teaming",
    description: "Attempt to find vulnerabilities and safety issues in the latest model version",
    taskType: "red-teaming",
    priority: 1.0,
    workloadEstimate: 20,
    status: "in-progress",
    tasksTotal: 30,
    tasksCompleted: 18,
    createdAt: "2026-04-05",
    assignedAnnotatorCount: 4,
  },
]

// Tasks - each task has ownership (annotator email, reviewer email)
// Status: unclaimed (available to pick), in-progress, paused, submitted, approved, rejected, revision-requested
export const tasks: Task[] = [
  // ANNOTATOR 1 (usr_001 - Alex Chen) tasks
  {
    id: "task_001",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Handle refund request scenario",
    description: "Generate appropriate responses for a customer requesting a refund for a damaged product received last week",
    taskType: "llm-training",
    status: "in-progress",
    priority: 0.55,
    estimatedDuration: 15,
    actualDuration: 10,
    startedAt: "2026-04-19T09:30:00Z",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
  },
  {
    id: "task_002",
    batchId: "batch_004",
    batchTitle: "Model Safety Red Teaming",
    workflowId: "wf_004",
    workflowName: "Red Teaming Initiative",
    title: "Test prompt injection resistance",
    description: "Attempt various prompt injection techniques and document model responses and any vulnerabilities found",
    taskType: "red-teaming",
    status: "submitted",
    priority: 1.0,
    externalUrl: "https://redteam.internal.ai/session/abc123",
    estimatedDuration: 30,
    actualDuration: 28,
    startedAt: "2026-04-18T14:00:00Z",
    completedAt: "2026-04-18T14:28:00Z",
    submittedAt: "2026-04-18T14:30:00Z",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
  },
  {
    id: "task_003",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Technical troubleshooting guidance",
    description: "Provide step-by-step troubleshooting for common technical issues with software installation",
    taskType: "llm-training",
    status: "approved",
    priority: 0.55,
    estimatedDuration: 20,
    actualDuration: 18,
    startedAt: "2026-04-17T10:00:00Z",
    completedAt: "2026-04-17T10:18:00Z",
    submittedAt: "2026-04-17T10:20:00Z",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    qualityScore: 92,
    feedback: "Excellent responses with clear step-by-step instructions. Good use of numbered lists.",
  },
  {
    id: "task_005",
    batchId: "batch_004",
    batchTitle: "Model Safety Red Teaming",
    workflowId: "wf_004",
    workflowName: "Red Teaming Initiative",
    title: "Test content policy boundaries",
    description: "Evaluate model responses at the edge of content policies and document any inconsistencies",
    taskType: "red-teaming",
    status: "revision-requested",
    priority: 1.0,
    estimatedDuration: 25,
    actualDuration: 22,
    startedAt: "2026-04-16T11:00:00Z",
    completedAt: "2026-04-16T11:22:00Z",
    submittedAt: "2026-04-16T11:25:00Z",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    feedback: "Please add more detailed documentation of the edge cases tested. Include specific prompts used.",
  },
  // ANNOTATOR 2 (usr_004 - Emily Davis) tasks
  {
    id: "task_009",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Product return process",
    description: "Guide customer through the product return and exchange process",
    taskType: "llm-training",
    status: "in-progress",
    priority: 0.55,
    estimatedDuration: 12,
    startedAt: "2026-04-19T10:00:00Z",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
  },
  {
    id: "task_010",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Account recovery assistance",
    description: "Help customer recover access to their locked account",
    taskType: "llm-training",
    status: "submitted",
    priority: 0.55,
    estimatedDuration: 10,
    actualDuration: 9,
    startedAt: "2026-04-19T08:00:00Z",
    completedAt: "2026-04-19T08:09:00Z",
    submittedAt: "2026-04-19T08:10:00Z",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
  },
  {
    id: "task_013",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Evaluate product comparison flow",
    description: "Complete a product comparison task on an e-commerce site",
    taskType: "agentic-ai",
    status: "submitted",
    priority: 0.9,
    estimatedDuration: 20,
    actualDuration: 18,
    startedAt: "2026-04-18T11:00:00Z",
    completedAt: "2026-04-18T11:18:00Z",
    submittedAt: "2026-04-18T11:20:00Z",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
  },
  // Additional annotator (usr_005 - James Wilson) tasks
  {
    id: "task_011",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Complete checkout process",
    description: "Navigate through a complete checkout flow including cart, shipping, and payment",
    taskType: "agentic-ai",
    status: "in-progress",
    priority: 0.9,
    estimatedDuration: 15,
    startedAt: "2026-04-19T09:15:00Z",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
  },
  {
    id: "task_012",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Product search and filter",
    description: "Use search and filter functionality to find specific products",
    taskType: "agentic-ai",
    status: "approved",
    priority: 0.9,
    estimatedDuration: 10,
    actualDuration: 11,
    startedAt: "2026-04-18T14:00:00Z",
    completedAt: "2026-04-18T14:11:00Z",
    submittedAt: "2026-04-18T14:12:00Z",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
    reviewerId: "usr_006",
    reviewerEmail: "maria.garcia@labelforge.ai",
    qualityScore: 88,
    feedback: "Good work. Consider providing more detail on search criteria in future tasks.",
  },
  {
    id: "task_014",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Complete travel booking flow",
    description: "Book a complete travel package including flight and hotel",
    taskType: "agentic-ai",
    status: "submitted",
    priority: 0.95,
    estimatedDuration: 15,
    actualDuration: 14,
    startedAt: "2026-04-18T15:00:00Z",
    completedAt: "2026-04-18T15:14:00Z",
    submittedAt: "2026-04-18T15:15:00Z",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
  },
  // Unclaimed tasks (available to pick from batches)
  {
    id: "task_015",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Book a flight reservation",
    description: "Navigate to a travel website and complete a flight booking process from search to confirmation",
    taskType: "agentic-ai",
    status: "unclaimed",
    priority: 0.95,
    externalUrl: "https://demo-travel.com/flights",
    estimatedDuration: 25,
  },
  {
    id: "task_016",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Fill out insurance form",
    description: "Complete a multi-page insurance application form with provided test data",
    taskType: "agentic-ai",
    status: "unclaimed",
    priority: 0.95,
    externalUrl: "https://demo-insurance.com/apply",
    estimatedDuration: 30,
  },
  {
    id: "task_017",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    workflowId: "wf_002",
    workflowName: "LLM Training Data",
    title: "Handle billing dispute",
    description: "Generate responses for a customer disputing charges on their account for the past month",
    taskType: "llm-training",
    status: "unclaimed",
    priority: 0.55,
    estimatedDuration: 15,
  },
  {
    id: "task_018",
    batchId: "batch_004",
    batchTitle: "Model Safety Red Teaming",
    workflowId: "wf_004",
    workflowName: "Red Teaming Initiative",
    title: "Test jailbreak resistance",
    description: "Attempt various jailbreak techniques and document model behavior",
    taskType: "red-teaming",
    status: "unclaimed",
    priority: 1.0,
    estimatedDuration: 35,
  },
]

export const reviews: Review[] = [
  {
    id: "rev_001",
    taskId: "task_002",
    taskTitle: "Test prompt injection resistance",
    batchId: "batch_004",
    batchTitle: "Model Safety Red Teaming",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    annotatorName: "Alex Chen",
    status: "pending",
    submittedAt: "2026-04-18T14:30:00Z",
  },
  {
    id: "rev_002",
    taskId: "task_003",
    taskTitle: "Technical troubleshooting guidance",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    annotatorName: "Alex Chen",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    reviewerName: "Sarah Johnson",
    status: "approved",
    submittedAt: "2026-04-17T10:20:00Z",
    reviewedAt: "2026-04-17T11:00:00Z",
    qualityScore: 92,
    feedback: "Excellent responses with clear step-by-step instructions. Good use of numbered lists.",
    criteriaScores: {
      accuracy: 95,
      completeness: 90,
      adherence: 91,
    },
  },
  {
    id: "rev_003",
    taskId: "task_005",
    taskTitle: "Test content policy boundaries",
    batchId: "batch_004",
    batchTitle: "Model Safety Red Teaming",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    annotatorName: "Alex Chen",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    reviewerName: "Sarah Johnson",
    status: "revision-requested",
    submittedAt: "2026-04-16T11:25:00Z",
    reviewedAt: "2026-04-16T14:00:00Z",
    feedback: "Please add more detailed documentation of the edge cases tested. Include specific prompts used.",
    criteriaScores: {
      accuracy: 85,
      completeness: 70,
      adherence: 88,
    },
  },
  {
    id: "rev_005",
    taskId: "task_010",
    taskTitle: "Account recovery assistance",
    batchId: "batch_002",
    batchTitle: "Customer Support Response Training",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
    annotatorName: "Emily Davis",
    status: "pending",
    submittedAt: "2026-04-19T08:10:00Z",
  },
  {
    id: "rev_006",
    taskId: "task_012",
    taskTitle: "Product search and filter",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
    annotatorName: "James Wilson",
    reviewerId: "usr_006",
    reviewerEmail: "maria.garcia@labelforge.ai",
    reviewerName: "Maria Garcia",
    status: "approved",
    submittedAt: "2026-04-18T14:12:00Z",
    reviewedAt: "2026-04-18T15:00:00Z",
    qualityScore: 88,
    feedback: "Good work. Consider providing more detail on search criteria in future tasks.",
    criteriaScores: {
      accuracy: 90,
      completeness: 85,
      adherence: 89,
    },
  },
  {
    id: "rev_007",
    taskId: "task_013",
    taskTitle: "Evaluate product comparison flow",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
    annotatorName: "Emily Davis",
    status: "pending",
    submittedAt: "2026-04-18T11:20:00Z",
  },
  {
    id: "rev_008",
    taskId: "task_014",
    taskTitle: "Complete travel booking flow",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
    annotatorName: "James Wilson",
    status: "pending",
    submittedAt: "2026-04-18T15:15:00Z",
  },
]

export const notifications: Notification[] = [
  {
    id: "notif_001",
    type: "batch-assigned",
    title: "New Batch Assigned",
    message: "You have been assigned to 'Agent Task Completion - Web Navigation' batch",
    read: false,
    createdAt: "2026-04-19T08:00:00Z",
    actionUrl: "/dashboard/batches/batch_001",
  },
  {
    id: "notif_002",
    type: "task-approved",
    title: "Task Approved",
    message: "Your task 'Technical troubleshooting guidance' has been approved with a score of 92",
    read: false,
    createdAt: "2026-04-17T11:00:00Z",
    actionUrl: "/dashboard/tasks/task_003",
  },
  {
    id: "notif_003",
    type: "priority-warning",
    title: "High Priority Tasks",
    message: "Model Safety Red Teaming batch has P0 priority tasks requiring attention",
    read: true,
    createdAt: "2026-04-19T06:00:00Z",
    actionUrl: "/dashboard/batches/batch_004",
  },
  {
    id: "notif_004",
    type: "review-needed",
    title: "Revision Requested",
    message: "Please revise 'Test content policy boundaries' based on reviewer feedback",
    read: false,
    createdAt: "2026-04-16T14:00:00Z",
    actionUrl: "/dashboard/tasks/task_005",
  },
]

export const dashboardStats: DashboardStats = {
  availableBatches: 4,
  activeTasks: 1,
  completedTasks: 15,
  signedOffTasks: 12,
  pendingReviews: 4,
  averageQualityScore: 91.5,
}

export const adminStats: AdminStats = {
  totalAnnotators: 3,
  totalReviewers: 2,
  totalTasksCompleted: 45,
  totalTasksPending: 12,
  averageTaskTime: 18,
  dailyToolUsageHours: 24.5,
}

export const analyticsData: AnalyticsData = {
  tasksCompletedByDay: [
    { date: "2026-04-13", count: 5 },
    { date: "2026-04-14", count: 8 },
    { date: "2026-04-15", count: 6 },
    { date: "2026-04-16", count: 10 },
    { date: "2026-04-17", count: 7 },
    { date: "2026-04-18", count: 9 },
    { date: "2026-04-19", count: 4 },
  ],
  tasksByType: [
    { type: "agentic-ai", count: 15 },
    { type: "llm-training", count: 45 },
    { type: "multimodal", count: 0 },
    { type: "evaluation", count: 0 },
    { type: "red-teaming", count: 18 },
    { type: "preference-ranking", count: 0 },
  ],
  qualityScoresTrend: [
    { date: "2026-04-13", score: 88 },
    { date: "2026-04-14", score: 90 },
    { date: "2026-04-15", score: 89 },
    { date: "2026-04-16", score: 92 },
    { date: "2026-04-17", score: 91 },
    { date: "2026-04-18", score: 93 },
    { date: "2026-04-19", score: 92 },
  ],
  annotatorPerformance: [
    { id: "usr_001", name: "Alex Chen", email: "alex.chen@labelforge.ai", tasksCompleted: 45, averageQuality: 91.5, averageTimeMinutes: 18, totalToolUsageHours: 8.5 },
    { id: "usr_004", name: "Emily Davis", email: "emily.davis@labelforge.ai", tasksCompleted: 38, averageQuality: 89.2, averageTimeMinutes: 22, totalToolUsageHours: 7.2 },
    { id: "usr_005", name: "James Wilson", email: "james.wilson@labelforge.ai", tasksCompleted: 32, averageQuality: 87.8, averageTimeMinutes: 25, totalToolUsageHours: 6.8 },
  ],
  reviewerActivity: [
    { id: "usr_002", name: "Sarah Johnson", email: "sarah.johnson@labelforge.ai", reviewsCompleted: 28, averageReviewTime: 12, approvalRate: 85 },
    { id: "usr_006", name: "Maria Garcia", email: "maria.garcia@labelforge.ai", reviewsCompleted: 22, averageReviewTime: 15, approvalRate: 82 },
  ],
}

// Helper to get tasks for a specific user (annotators only see their own tasks)
export function getTasksForUser(userId: string, role: string): Task[] {
  if (role === "annotator") {
    // Annotators only see tasks assigned to them (not unclaimed tasks in their task list)
    return tasks.filter(t => t.annotatorId === userId)
  }
  if (role === "reviewer") {
    // Reviewers only see tasks that have been submitted and are ready for review
    return tasks.filter(t => t.status === "submitted")
  }
  // Admin sees all tasks
  return tasks
}

// Helper to get available (unclaimed) tasks from a batch
export function getUnclaimedTasksFromBatch(batchId: string): Task[] {
  return tasks.filter(t => t.batchId === batchId && t.status === "unclaimed")
}

// Helper to check if a reviewer can take on more reviews
export function canReviewerTakeMoreReviews(reviewerId: string): boolean {
  const activeReviewCount = reviews.filter(
    r => r.reviewerId === reviewerId && r.status === "in-review"
  ).length
  return activeReviewCount < 2
}
