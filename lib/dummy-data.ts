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

export const users = [
  testAnnotator1,
  testAnnotator2,
  testReviewer1,
  testReviewer2,
  testAdmin1,
  testAdmin2,
  additionalAnnotator,
]

// Validate credentials for login flow
export function validateCredentials(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email)
  if (!user) return null
  if (user.testPassword !== password) return null
  return user
}

// Validate OTP for login flow
export function validateOtp(email: string, otp: string): User | null {
  const user = users.find((u) => u.email === email)
  if (!user) return null
  if (user.testOtp !== otp) return null
  return user
}

// NOTE: currentUser is now determined dynamically from auth context in useAuth() hook
// Use the useAuth() hook in client components to get the authenticated user
// For server components, you need to pass user data from a client parent component
export const defaultUser: User = testAnnotator1

// ============================================
// WORKFLOWS - ONLY 3 WORKFLOWS
// ============================================
// Hierarchy: Workflow -> Batches -> Tasks
// Only LLM, Agentic AI, and Multimodal

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
    batchCount: 0,
    taskCount: 0,
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
]

// Tasks - each task has ownership (annotator email, reviewer email)
// Status: unclaimed (available to pick), in-progress, paused, submitted, approved, rejected, revision-requested
export const tasks: Task[] = [
  // AGENTIC AI TASKS WITH SUBMISSION DATA
  {
    id: "task_011",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Navigate to booking page and fill form",
    description: "Complete a hotel booking task on example-travel.com. Fill in dates, guest count, and preferences.",
    taskType: "agentic-ai",
    status: "submitted",
    priority: 0.95,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_011",
    estimatedDuration: 25,
    actualDuration: 23,
    startedAt: "2026-04-18T14:00:00Z",
    completedAt: "2026-04-18T14:23:00Z",
    submittedAt: "2026-04-18T14:25:00Z",
    annotatorId: "usr_001",
    annotatorEmail: "alex.chen@labelforge.ai",
    submissionData: {
      hotelName: "Grand Plaza Hotel",
      checkInDate: "2026-05-15",
      checkOutDate: "2026-05-20",
      guestCount: 2,
      roomType: "Deluxe Suite",
      specialRequests: "High floor, city view",
      totalPrice: 1250.00,
      completionStatus: "success",
      steps_taken: 8,
      navigation_path: ["home", "search", "results", "details", "booking", "payment", "confirmation"],
    },
    screenshots: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      "https://images.unsplash.com/photo-1551632786-6a81a27a4d41?w=800",
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800",
      "https://images.unsplash.com/photo-1585399781851-7dd02ceeba7d?w=800",
    ],
  },
  {
    id: "task_012",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Search and compare products",
    description: "Find laptop recommendations under $1000 and compare specifications",
    taskType: "agentic-ai",
    status: "submitted",
    priority: 0.9,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_012",
    estimatedDuration: 20,
    actualDuration: 18,
    startedAt: "2026-04-19T10:00:00Z",
    completedAt: "2026-04-19T10:18:00Z",
    submittedAt: "2026-04-19T10:20:00Z",
    annotatorId: "usr_004",
    annotatorEmail: "emily.davis@labelforge.ai",
    submissionData: {
      searchQuery: "laptop under 1000",
      itemsFound: 42,
      itemsCompared: 5,
      topChoice: {
        brand: "TechBrand X",
        model: "UltraBook Pro 14",
        price: 899.99,
        specs: {
          processor: "Intel i7-12700H",
          ram: "16GB DDR5",
          storage: "512GB SSD",
          display: "14 inch FHD",
          weight: "1.4kg",
        },
      },
      comparisonMetrics: {
        priceRange: "599-999",
        averageRating: 4.5,
        filterApplied: ["price", "processor", "ram"],
      },
    },
    screenshots: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=800",
      "https://images.unsplash.com/photo-1588872657840-790ff3bde172?w=800",
    ],
  },
  {
    id: "task_013",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Create account and verify email",
    description: "Sign up for an account on example-retail.com and complete email verification",
    taskType: "agentic-ai",
    status: "approved",
    priority: 0.95,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_013",
    estimatedDuration: 10,
    actualDuration: 9,
    startedAt: "2026-04-17T09:00:00Z",
    completedAt: "2026-04-17T09:09:00Z",
    submittedAt: "2026-04-17T09:10:00Z",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    qualityScore: 95,
    feedback: "Excellent task completion. All steps verified correctly.",
    submissionData: {
      email: "user@example.com",
      accountCreated: true,
      emailVerified: true,
      verificationTime: "2:15",
      passwordStrength: "strong",
    },
    screenshots: [
      "https://images.unsplash.com/photo-1563986768609-322da13e7980?w=800",
      "https://images.unsplash.com/photo-1563986768060-00c8ad0a3800?w=800",
    ],
  },
  // UNCLAIMED AGENTIC AI TASKS
  {
    id: "task_014",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Fill out feedback form",
    description: "Complete a customer feedback survey with realistic responses",
    taskType: "agentic-ai",
    status: "unclaimed",
    priority: 0.95,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_014",
    estimatedDuration: 12,
  },
  {
    id: "task_015",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Subscribe to newsletter",
    description: "Find and complete newsletter subscription process",
    taskType: "agentic-ai",
    status: "unclaimed",
    priority: 0.95,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_015",
    estimatedDuration: 8,
  },
  {
    id: "task_016",
    batchId: "batch_008",
    batchTitle: "Agent Task Completion - E-commerce Flows",
    workflowId: "wf_001",
    workflowName: "Agentic AI Evaluation",
    title: "Apply discount code at checkout",
    description: "Complete purchase using a promotional discount code",
    taskType: "agentic-ai",
    status: "unclaimed",
    priority: 0.9,
    externalUrl: "https://agentic-eval.labelforge.ai/session/task_016",
    estimatedDuration: 15,
  },
]

export const reviews: Review[] = [
  {
    id: "rev_001",
    taskId: "task_013",
    taskTitle: "Create account and verify email",
    batchId: "batch_001",
    batchTitle: "Agent Task Completion - Web Navigation",
    annotatorId: "usr_005",
    annotatorEmail: "james.wilson@labelforge.ai",
    annotatorName: "James Wilson",
    reviewerId: "usr_002",
    reviewerEmail: "sarah.johnson@labelforge.ai",
    reviewerName: "Sarah Johnson",
    status: "approved",
    submittedAt: "2026-04-17T09:10:00Z",
    reviewedAt: "2026-04-17T10:00:00Z",
    qualityScore: 95,
    feedback: "Excellent task completion. All steps verified correctly.",
    criteriaScores: {
      accuracy: 98,
      completeness: 95,
      adherence: 92,
    },
  },
]

// Role-based notifications
export function getNotificationsForUser(userId: string, role: string): Notification[] {
  const baseNotifications: Notification[] = []

  if (role === "annotator") {
    // Annotator notifications
    baseNotifications.push(
      {
        id: "notif_001",
        type: "batch-assigned",
        title: "New Agentic AI Task Available",
        message: "New task available in 'Agent Task Completion - E-commerce Flows'",
        read: false,
        createdAt: "2026-04-19T08:00:00Z",
        actionUrl: "/dashboard/batches/batch_008",
      },
      {
        id: "notif_002",
        type: "task-approved",
        title: "Task Approved",
        message: "Your task 'Create account and verify email' was approved with score 95",
        read: false,
        createdAt: "2026-04-17T10:00:00Z",
        actionUrl: "/dashboard/tasks/task_013",
      },
      {
        id: "notif_003",
        type: "review-needed",
        title: "Revision Needed",
        message: "Please check feedback on your submitted task",
        read: true,
        createdAt: "2026-04-16T14:00:00Z",
        actionUrl: "/dashboard/tasks/task_005",
      }
    )
  } else if (role === "reviewer") {
    // Reviewer notifications
    baseNotifications.push(
      {
        id: "notif_101",
        type: "review-needed",
        title: "Tasks Pending Review",
        message: "3 new agentic AI tasks submitted for your review",
        read: false,
        createdAt: "2026-04-19T09:00:00Z",
        actionUrl: "/dashboard/reviews",
      },
      {
        id: "notif_102",
        type: "priority-warning",
        title: "High Priority Review",
        message: "Critical agentic AI submissions await your review",
        read: false,
        createdAt: "2026-04-19T08:30:00Z",
        actionUrl: "/dashboard/reviews",
      }
    )
  } else if (role === "admin") {
    // Admin notifications
    baseNotifications.push(
      {
        id: "notif_201",
        type: "batch-assigned",
        title: "Agentic AI Workflow Active",
        message: "Both batches of Agentic AI Evaluation are progressing well",
        read: false,
        createdAt: "2026-04-19T08:00:00Z",
        actionUrl: "/dashboard/workflows/wf_001",
      },
      {
        id: "notif_202",
        type: "system",
        title: "Daily Report Ready",
        message: "Today's completion report is available for download",
        read: true,
        createdAt: "2026-04-19T07:00:00Z",
        actionUrl: "/dashboard",
      },
      {
        id: "notif_203",
        type: "priority-warning",
        title: "LLM & Multimodal Workflows",
        message: "LLM Training Data and Multimodal Assessment have 0 active tasks",
        read: false,
        createdAt: "2026-04-19T06:00:00Z",
        actionUrl: "/dashboard/workflows",
      }
    )
  }

  return baseNotifications
}

export const notifications: Notification[] = getNotificationsForUser("usr_001", "annotator")

export const dashboardStats: DashboardStats = {
  availableBatches: 2,
  activeTasks: 3,
  completedTasks: 2,
  signedOffTasks: 1,
  pendingReviews: 2,
  averageQualityScore: 94,
}

export const adminStats: AdminStats = {
  totalAnnotators: 3,
  totalReviewers: 2,
  totalTasksCompleted: 3,
  totalTasksPending: 3,
  averageTaskTime: 17,
  dailyToolUsageHours: 12.5,
}

export const analyticsData: AnalyticsData = {
  tasksCompletedByDay: [
    { date: "2026-04-13", count: 2 },
    { date: "2026-04-14", count: 3 },
    { date: "2026-04-15", count: 2 },
    { date: "2026-04-16", count: 1 },
    { date: "2026-04-17", count: 1 },
    { date: "2026-04-18", count: 1 },
    { date: "2026-04-19", count: 1 },
  ],
  tasksByType: [
    { type: "agentic-ai", count: 8 },
    { type: "llm-training", count: 0 },
    { type: "multimodal", count: 0 },
    { type: "evaluation", count: 0 },
    { type: "red-teaming", count: 0 },
    { type: "preference-ranking", count: 0 },
    { type: "benchmarking", count: 0 },
    { type: "data-collection", count: 0 },
  ],
  qualityScoresTrend: [
    { date: "2026-04-13", score: 92 },
    { date: "2026-04-14", score: 93 },
    { date: "2026-04-15", score: 93 },
    { date: "2026-04-16", score: 94 },
    { date: "2026-04-17", score: 95 },
    { date: "2026-04-18", score: 94 },
    { date: "2026-04-19", score: 94 },
  ],
  annotatorPerformance: [
    {
      id: "usr_001",
      name: "Alex Chen",
      email: "alex.chen@labelforge.ai",
      tasksCompleted: 1,
      averageQuality: 94,
      averageTimeMinutes: 23,
      totalToolUsageHours: 2.5,
    },
    {
      id: "usr_004",
      name: "Emily Davis",
      email: "emily.davis@labelforge.ai",
      tasksCompleted: 1,
      averageQuality: 94,
      averageTimeMinutes: 18,
      totalToolUsageHours: 2.1,
    },
    {
      id: "usr_005",
      name: "James Wilson",
      email: "james.wilson@labelforge.ai",
      tasksCompleted: 1,
      averageQuality: 95,
      averageTimeMinutes: 9,
      totalToolUsageHours: 1.8,
    },
  ],
  reviewerActivity: [
    {
      id: "usr_002",
      name: "Sarah Johnson",
      email: "sarah.johnson@labelforge.ai",
      reviewsCompleted: 1,
      averageReviewTime: 60,
      approvalRate: 100,
    },
  ],
}

// Helper to get tasks for a specific user (annotators only see their own tasks)
export function getTasksForUser(userId: string, role: string): Task[] {
  if (role === "annotator") {
    // Annotators only see tasks assigned to them (not unclaimed tasks in their task list)
    return tasks.filter((t) => t.annotatorId === userId)
  } else if (role === "reviewer") {
    // Reviewers see all submitted/approved/rejected tasks for review
    return tasks.filter(
      (t) =>
        t.status === "submitted" ||
        t.status === "revision-requested" ||
        t.status === "approved" ||
        t.status === "rejected"
    )
  } else {
    // Admins see all tasks
    return tasks
  }
}

// Helper to get unclaimed tasks in a batch
export function getUnclaimedTasksFromBatch(batchId: string): Task[] {
  return tasks.filter((t) => t.batchId === batchId && t.status === "unclaimed")
}

// Helper to determine if reviewer can take more tasks (max 2 concurrent reviews)
export function canReviewerTakeMoreReviews(reviewerId: string): boolean {
  const activeReviews = reviews.filter(
    (r) => r.reviewerId === reviewerId && r.status === "in-review"
  )
  return activeReviews.length < 2
}

// Helper to get stats based on user role
export function getStatsForRole(role: string): DashboardStats {
  if (role === "admin") {
    return adminStats
  }
  return dashboardStats
}
