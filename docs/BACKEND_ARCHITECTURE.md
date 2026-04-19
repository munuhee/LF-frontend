# LabelForge Backend Architecture

## Executive Summary

This document outlines the microservices-based backend architecture for the LabelForge AI Training Operations Platform. The architecture is designed to support scalable, secure, and reliable operations for managing AI training workflows including task management, quality assurance, session tracking, and analytics.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Microservices](#3-microservices)
4. [API Gateway](#4-api-gateway)
5. [Data Models](#5-data-models)
6. [API Specifications](#6-api-specifications)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Event-Driven Architecture](#8-event-driven-architecture)
9. [Database Design](#9-database-design)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Monitoring & Observability](#11-monitoring--observability)

---

## 1. System Overview

### 1.1 Architecture Principles

- **Microservices**: Each domain is a separate, independently deployable service
- **API Gateway**: Single entry point for all client requests with routing, auth, and rate limiting
- **Event-Driven**: Async communication between services via message queue
- **Domain-Driven Design**: Services aligned with business domains
- **CQRS Pattern**: Separate read/write models for complex domains

### 1.2 Technology Stack (Recommended)

| Component | Technology |
|-----------|------------|
| API Gateway | Kong / AWS API Gateway / Express Gateway |
| Services | Node.js (NestJS) / Python (FastAPI) / Go |
| Database | PostgreSQL (primary), Redis (cache), MongoDB (sessions) |
| Message Queue | RabbitMQ / Apache Kafka |
| Search | Elasticsearch |
| Container Orchestration | Kubernetes |
| CI/CD | GitHub Actions / GitLab CI |
| Monitoring | Prometheus + Grafana, Datadog |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   Web App        │  │  Browser Ext.    │  │   Mobile App (Future)    │  │
│  │   (Next.js)      │  │  (Chrome/Firefox)│  │                          │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
└───────────┼─────────────────────┼─────────────────────────┼────────────────┘
            │                     │                         │
            └─────────────────────┼─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Authentication & JWT Validation                                    │   │
│  │  • Rate Limiting & Throttling                                         │   │
│  │  • Request Routing                                                    │   │
│  │  • API Versioning                                                     │   │
│  │  • Request/Response Transformation                                    │   │
│  │  • SSL Termination                                                    │   │
│  │  • CORS Handling                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        │                        │                            │
        ▼                        ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           SERVICE MESH                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Auth      │  │   User      │  │   Batch     │  │   Task      │      │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Session   │  │   Review    │  │  Analytics  │  │ Notification│      │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────────────────────┘
        │                        │                            │
        ▼                        ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE QUEUE                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     RabbitMQ / Apache Kafka                          │   │
│  │  Topics: task.created, task.submitted, review.completed,             │   │
│  │          session.started, batch.assigned, user.activity              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
        │                        │                            │
        ▼                        ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   MongoDB    │  │Elasticsearch │  │
│  │  (Primary)   │  │   (Cache)    │  │  (Sessions)  │  │  (Search)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Microservices

### 3.1 Auth Service

**Responsibility**: Authentication, authorization, token management

```
Port: 3001
Base Path: /api/v1/auth

Endpoints:
  POST   /login              - Authenticate user
  POST   /logout             - Invalidate session
  POST   /verify-otp         - Verify 2FA code
  POST   /refresh            - Refresh access token
  POST   /forgot-password    - Initiate password reset
  POST   /reset-password     - Complete password reset
  GET    /me                 - Get current user info
  
Dependencies:
  - Redis (session storage)
  - PostgreSQL (user credentials)
  - Notification Service (email OTPs)
```

### 3.2 User Service

**Responsibility**: User management, profiles, roles

```
Port: 3002
Base Path: /api/v1/users

Endpoints:
  GET    /                   - List users (admin)
  GET    /:id                - Get user by ID
  PUT    /:id                - Update user profile
  PATCH  /:id/role           - Update user role (admin)
  GET    /:id/stats          - Get user statistics
  GET    /:id/activity       - Get user activity log
  DELETE /:id                - Deactivate user (admin)
  
Dependencies:
  - PostgreSQL (user data)
  - Redis (caching)
```

### 3.3 Batch Service

**Responsibility**: Batch management, assignments

```
Port: 3003
Base Path: /api/v1/batches

Endpoints:
  GET    /                   - List batches
  POST   /                   - Create batch (admin)
  GET    /:id                - Get batch details
  PUT    /:id                - Update batch
  DELETE /:id                - Delete batch (admin)
  POST   /:id/assign         - Assign users to batch
  GET    /:id/tasks          - Get batch tasks
  GET    /:id/progress       - Get batch progress
  GET    /:id/analytics      - Get batch analytics

Dependencies:
  - PostgreSQL (batch data)
  - Task Service (task management)
  - Message Queue (batch.assigned events)
```

### 3.4 Task Service

**Responsibility**: Task lifecycle management

```
Port: 3004
Base Path: /api/v1/tasks

Endpoints:
  GET    /                   - List tasks
  GET    /my                 - Get my assigned tasks
  POST   /                   - Create task (admin)
  GET    /:id                - Get task details
  PUT    /:id                - Update task
  DELETE /:id                - Delete task (admin)
  POST   /:id/start          - Start working on task
  POST   /:id/pause          - Pause task
  POST   /:id/resume         - Resume task
  POST   /:id/submit         - Submit task for review
  POST   /:id/withdraw       - Withdraw submitted task

Dependencies:
  - PostgreSQL (task data)
  - Session Service (activity tracking)
  - Review Service (submission handling)
  - Message Queue (task lifecycle events)
```

### 3.5 Session Service

**Responsibility**: Work session tracking, activity recording

```
Port: 3005
Base Path: /api/v1/sessions

Endpoints:
  GET    /                   - List sessions
  GET    /active             - Get active sessions
  POST   /                   - Start new session
  GET    /:id                - Get session details
  PUT    /:id                - Update session
  POST   /:id/end            - End session
  POST   /:id/events         - Record activity events (from extension)
  GET    /:id/events         - Get session events
  GET    /:id/playback       - Get session playback data

Dependencies:
  - MongoDB (session events - high volume)
  - PostgreSQL (session metadata)
  - Redis (active session tracking)
```

### 3.6 Review Service

**Responsibility**: QA review workflow

```
Port: 3006
Base Path: /api/v1/reviews

Endpoints:
  GET    /                   - List reviews
  GET    /pending            - Get pending reviews (reviewer)
  GET    /my                 - Get my submitted reviews
  GET    /:id                - Get review details
  POST   /:id/start          - Start review (reviewer)
  POST   /:id/approve        - Approve task
  POST   /:id/reject         - Reject task
  POST   /:id/request-revision - Request revision
  PUT    /:id/score          - Update quality scores
  POST   /:id/feedback       - Add feedback

Dependencies:
  - PostgreSQL (review data)
  - Task Service (status updates)
  - Notification Service (review notifications)
  - Message Queue (review.completed events)
```

### 3.7 Analytics Service

**Responsibility**: Metrics, reports, dashboards

```
Port: 3007
Base Path: /api/v1/analytics

Endpoints:
  GET    /dashboard          - Get dashboard stats
  GET    /tasks/completion   - Task completion metrics
  GET    /tasks/by-type      - Tasks by type breakdown
  GET    /quality/trend      - Quality score trends
  GET    /performance/team   - Team performance metrics
  GET    /performance/user/:id - Individual performance
  GET    /batches/:id/report - Batch report
  POST   /export             - Export report

Dependencies:
  - PostgreSQL (aggregated data)
  - Elasticsearch (complex queries)
  - Redis (cached metrics)
```

### 3.8 Notification Service

**Responsibility**: Email, push, in-app notifications

```
Port: 3008
Base Path: /api/v1/notifications

Endpoints:
  GET    /                   - List notifications
  GET    /unread             - Get unread count
  PUT    /:id/read           - Mark as read
  PUT    /read-all           - Mark all as read
  DELETE /:id                - Delete notification
  GET    /preferences        - Get notification preferences
  PUT    /preferences        - Update preferences

Internal Endpoints (service-to-service):
  POST   /send               - Send notification
  POST   /send-email         - Send email
  POST   /send-push          - Send push notification

Dependencies:
  - PostgreSQL (notification data)
  - Redis (real-time delivery)
  - SendGrid/SES (email)
  - Firebase (push)
  - WebSocket server (real-time)
```

---

## 4. API Gateway

### 4.1 Route Configuration

```yaml
# Kong/Express Gateway Configuration

routes:
  - name: auth-service
    paths:
      - /api/v1/auth
    service: auth-service
    plugins:
      - rate-limiting:
          second: 10
          
  - name: user-service
    paths:
      - /api/v1/users
    service: user-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 100
          
  - name: batch-service
    paths:
      - /api/v1/batches
    service: batch-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 100
          
  - name: task-service
    paths:
      - /api/v1/tasks
    service: task-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 100
          
  - name: session-service
    paths:
      - /api/v1/sessions
    service: session-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 500  # Higher for extension events
          
  - name: review-service
    paths:
      - /api/v1/reviews
    service: review-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 100
          
  - name: analytics-service
    paths:
      - /api/v1/analytics
    service: analytics-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 50
          
  - name: notification-service
    paths:
      - /api/v1/notifications
    service: notification-service
    plugins:
      - jwt-auth
      - rate-limiting:
          second: 100
```

### 4.2 Rate Limiting Strategy

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth endpoints | 10 req | 1 sec |
| Session events (extension) | 500 req | 1 sec |
| Standard API | 100 req | 1 sec |
| Analytics/Export | 50 req | 1 sec |

---

## 5. Data Models

### 5.1 User Model

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, indexed
  password_hash: string;         // bcrypt hashed
  name: string;
  role: 'annotator' | 'reviewer' | 'admin';
  department?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      task_reminders: boolean;
      review_alerts: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}
```

### 5.2 Batch Model

```typescript
interface Batch {
  id: string;                    // UUID
  title: string;
  description: string;
  task_type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'available' | 'in_progress' | 'completed' | 'archived';
  deadline: Date;
  workload_estimate_hours: number;
  tasks_total: number;
  tasks_completed: number;
  assigned_users: string[];      // User IDs
  created_by: string;            // User ID
  guidelines_url?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

type TaskType = 
  | 'agentic_ai'
  | 'llm_training'
  | 'multimodal'
  | 'evaluation'
  | 'benchmarking'
  | 'preference_ranking'
  | 'red_teaming'
  | 'data_collection';
```

### 5.3 Task Model

```typescript
interface Task {
  id: string;                    // UUID
  batch_id: string;              // FK to Batch
  title: string;
  description: string;
  instructions?: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  external_url?: string;         // For agentic AI tasks
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  assigned_to: string;           // User ID
  started_at?: Date;
  paused_at?: Date;
  completed_at?: Date;
  submitted_at?: Date;
  reviewed_by?: string;          // User ID
  quality_score?: number;        // 0-100
  feedback?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

type TaskStatus = 
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';
```

### 5.4 Session Model

```typescript
interface Session {
  id: string;                    // UUID
  task_id: string;               // FK to Task
  user_id: string;               // FK to User
  status: 'active' | 'paused' | 'completed';
  start_time: Date;
  end_time?: Date;
  duration_seconds: number;
  events_count: number;
  browser_info?: {
    name: string;
    version: string;
    os: string;
  };
  extension_version?: string;
  created_at: Date;
  updated_at: Date;
}

// Stored in MongoDB for high-volume write
interface SessionEvent {
  id: string;                    // ObjectId
  session_id: string;
  timestamp: Date;
  event_type: 'click' | 'input' | 'navigation' | 'scroll' | 'form_submit' | 'custom';
  target?: {
    tag: string;
    id?: string;
    class?: string;
    text?: string;
  };
  url: string;
  data?: Record<string, any>;
}
```

### 5.5 Review Model

```typescript
interface Review {
  id: string;                    // UUID
  task_id: string;               // FK to Task
  annotator_id: string;          // FK to User
  reviewer_id?: string;          // FK to User
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_requested';
  submitted_at: Date;
  started_at?: Date;
  completed_at?: Date;
  criteria_scores?: {
    accuracy: number;            // 0-100
    completeness: number;        // 0-100
    adherence: number;           // 0-100
  };
  overall_score?: number;        // 0-100
  feedback?: string;
  revision_count: number;
  created_at: Date;
  updated_at: Date;
}
```

### 5.6 Notification Model

```typescript
interface Notification {
  id: string;                    // UUID
  user_id: string;               // FK to User
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  expires_at?: Date;
}

type NotificationType = 
  | 'batch_assigned'
  | 'task_assigned'
  | 'task_approved'
  | 'task_rejected'
  | 'revision_requested'
  | 'review_needed'
  | 'deadline_warning'
  | 'system_announcement';
```

---

## 6. API Specifications

### 6.1 Authentication Flow

```
┌────────────┐                    ┌──────────────┐                  ┌─────────────┐
│   Client   │                    │  API Gateway │                  │ Auth Service│
└─────┬──────┘                    └──────┬───────┘                  └──────┬──────┘
      │                                  │                                 │
      │  POST /api/v1/auth/login         │                                 │
      │  {email, password}               │                                 │
      │─────────────────────────────────>│                                 │
      │                                  │    Validate credentials         │
      │                                  │────────────────────────────────>│
      │                                  │                                 │
      │                                  │    OTP required                 │
      │                                  │<────────────────────────────────│
      │                                  │                                 │
      │  202 Accepted                    │                                 │
      │  {requires_2fa: true, token}     │                                 │
      │<─────────────────────────────────│                                 │
      │                                  │                                 │
      │  POST /api/v1/auth/verify-otp    │                                 │
      │  {temp_token, otp_code}          │                                 │
      │─────────────────────────────────>│                                 │
      │                                  │    Verify OTP                   │
      │                                  │────────────────────────────────>│
      │                                  │                                 │
      │                                  │    Access + Refresh tokens      │
      │                                  │<────────────────────────────────│
      │                                  │                                 │
      │  200 OK                          │                                 │
      │  {access_token, refresh_token}   │                                 │
      │<─────────────────────────────────│                                 │
      │                                  │                                 │
```

### 6.2 Task Workflow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Client   │     │Task Service│     │Session Svc │     │Review Svc  │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │                  │
      │ POST /tasks/:id/start              │                  │
      │─────────────────>│                  │                  │
      │                  │                  │                  │
      │                  │ Create session   │                  │
      │                  │─────────────────>│                  │
      │                  │                  │                  │
      │                  │ session_id       │                  │
      │                  │<─────────────────│                  │
      │                  │                  │                  │
      │ 200 {task, session}                │                  │
      │<─────────────────│                  │                  │
      │                  │                  │                  │
      │ POST /sessions/:id/events          │                  │
      │ (from extension) │                  │                  │
      │─────────────────────────────────────>                  │
      │                  │                  │                  │
      │ POST /tasks/:id/submit             │                  │
      │─────────────────>│                  │                  │
      │                  │                  │                  │
      │                  │ End session      │                  │
      │                  │─────────────────>│                  │
      │                  │                  │                  │
      │                  │ Create review    │                  │
      │                  │─────────────────────────────────────>
      │                  │                  │                  │
      │ 200 OK           │                  │                  │
      │<─────────────────│                  │                  │
      │                  │                  │                  │
```

### 6.3 Sample API Responses

**GET /api/v1/batches**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "batch_001",
        "title": "GPT-5 Agent Task Completion",
        "description": "Complete complex multi-step tasks...",
        "task_type": "agentic_ai",
        "priority": "high",
        "status": "available",
        "deadline": "2026-04-25T00:00:00Z",
        "workload_estimate_hours": 40,
        "tasks_total": 50,
        "tasks_completed": 0,
        "progress_percentage": 0,
        "assigned_users": ["usr_001", "usr_004"],
        "created_at": "2026-04-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_items": 6,
      "total_pages": 1
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-04-19T10:30:00Z"
  }
}
```

**POST /api/v1/tasks/:id/submit**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_001",
      "status": "submitted",
      "submitted_at": "2026-04-19T11:00:00Z"
    },
    "review": {
      "id": "rev_005",
      "status": "pending",
      "submitted_at": "2026-04-19T11:00:00Z"
    }
  },
  "message": "Task submitted for review successfully"
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "The requested task does not exist",
    "details": {
      "task_id": "task_999"
    }
  },
  "meta": {
    "request_id": "req_def456",
    "timestamp": "2026-04-19T10:35:00Z"
  }
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT Token Structure

```typescript
// Access Token (15 min expiry)
interface AccessTokenPayload {
  sub: string;         // User ID
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// Refresh Token (7 days expiry)
interface RefreshTokenPayload {
  sub: string;         // User ID
  jti: string;         // Unique token ID
  iat: number;
  exp: number;
}
```

### 7.2 Role-Based Access Control (RBAC)

```typescript
const permissions = {
  annotator: [
    'tasks:read:own',
    'tasks:update:own',
    'sessions:create',
    'sessions:read:own',
    'reviews:read:own',
    'batches:read',
    'notifications:read:own',
    'profile:read:own',
    'profile:update:own'
  ],
  reviewer: [
    // All annotator permissions
    ...permissions.annotator,
    'reviews:create',
    'reviews:update',
    'tasks:read:all',
    'sessions:read:all'
  ],
  admin: [
    '*'  // All permissions
  ]
};
```

### 7.3 API Key Authentication (Extension)

```
Header: X-Extension-API-Key: {api_key}
Header: X-Extension-Version: 1.0.0
Header: X-Session-ID: {session_id}
```

---

## 8. Event-Driven Architecture

### 8.1 Event Topics

```typescript
// Task Events
interface TaskCreatedEvent {
  event_type: 'task.created';
  task_id: string;
  batch_id: string;
  assigned_to: string;
  timestamp: Date;
}

interface TaskSubmittedEvent {
  event_type: 'task.submitted';
  task_id: string;
  batch_id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
}

// Review Events
interface ReviewCompletedEvent {
  event_type: 'review.completed';
  review_id: string;
  task_id: string;
  annotator_id: string;
  reviewer_id: string;
  status: 'approved' | 'rejected' | 'revision_requested';
  score?: number;
  timestamp: Date;
}

// Batch Events
interface BatchAssignedEvent {
  event_type: 'batch.assigned';
  batch_id: string;
  user_ids: string[];
  assigned_by: string;
  timestamp: Date;
}

// Session Events
interface SessionStartedEvent {
  event_type: 'session.started';
  session_id: string;
  task_id: string;
  user_id: string;
  timestamp: Date;
}
```

### 8.2 Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MESSAGE QUEUE                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                        TOPICS                                │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │task.created  │  │task.submitted│  │task.status   │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │review.*      │  │batch.assigned│  │session.*     │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Notification   │    │   Analytics     │    │    Search       │
│    Consumer     │    │    Consumer     │    │    Indexer      │
│                 │    │                 │    │                 │
│  • Send emails  │    │  • Update stats │    │  • Index docs   │
│  • Push notifs  │    │  • Cache metrics│    │  • Update ES    │
│  • In-app alerts│    │  • Generate     │    │                 │
│                 │    │    reports      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 9. Database Design

### 9.1 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'annotator',
    department VARCHAR(255),
    avatar_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    deadline TIMESTAMP WITH TIME ZONE,
    workload_estimate_hours INTEGER,
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    assigned_users UUID[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    guidelines_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_task_type ON batches(task_type);
CREATE INDEX idx_batches_deadline ON batches(deadline);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    instructions TEXT,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    external_url TEXT,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    assigned_to UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    feedback TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_batch_id ON tasks(batch_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Sessions table (metadata)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    browser_info JSONB,
    extension_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_task_id ON sessions(task_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    annotator_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    criteria_scores JSONB,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    feedback TEXT,
    revision_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_task_id ON reviews(task_id);
CREATE INDEX idx_reviews_annotator_id ON reviews(annotator_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 9.2 MongoDB Collections

```javascript
// Session Events Collection (high-volume writes)
db.createCollection("session_events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["session_id", "timestamp", "event_type", "url"],
      properties: {
        session_id: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        event_type: {
          enum: ["click", "input", "navigation", "scroll", "form_submit", "custom"]
        },
        target: {
          bsonType: "object",
          properties: {
            tag: { bsonType: "string" },
            id: { bsonType: "string" },
            class: { bsonType: "string" },
            text: { bsonType: "string" }
          }
        },
        url: { bsonType: "string" },
        data: { bsonType: "object" }
      }
    }
  }
});

// Indexes for efficient queries
db.session_events.createIndex({ "session_id": 1, "timestamp": 1 });
db.session_events.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 }); // 30 day TTL
```

---

## 10. Deployment Architecture

### 10.1 Kubernetes Deployment

```yaml
# Example Kubernetes deployment for Task Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-service
  namespace: labelforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-service
  template:
    metadata:
      labels:
        app: task-service
    spec:
      containers:
      - name: task-service
        image: labelforge/task-service:latest
        ports:
        - containerPort: 3004
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: mq-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3004
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3004
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: task-service
  namespace: labelforge
spec:
  selector:
    app: task-service
  ports:
  - port: 3004
    targetPort: 3004
  type: ClusterIP
```

### 10.2 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD PROVIDER                                   │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          LOAD BALANCER                                  │  │
│  │                     (AWS ALB / GCP LB / Cloudflare)                     │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐  │
│  │                         KUBERNETES CLUSTER                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │                     INGRESS CONTROLLER                           │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        API GATEWAY                                │  │  │
│  │  │                    (Kong / Express Gateway)                       │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │
│  │  │   Auth     │ │   User     │ │   Batch    │ │   Task     │          │  │
│  │  │  (x2 pods) │ │  (x2 pods) │ │  (x2 pods) │ │  (x3 pods) │          │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │  │
│  │                                                                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │
│  │  │  Session   │ │   Review   │ │ Analytics  │ │Notification│          │  │
│  │  │  (x3 pods) │ │  (x2 pods) │ │  (x2 pods) │ │  (x2 pods) │          │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │  │
│  │                                                                         │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         MANAGED SERVICES                                  │ │
│  │                                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  PostgreSQL  │  │    Redis     │  │   MongoDB    │  │    S3/GCS    │ │ │
│  │  │   (RDS)      │  │(ElastiCache) │  │   (Atlas)    │  │   (Storage)  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐                                      │ │
│  │  │  RabbitMQ    │  │Elasticsearch │                                      │ │
│  │  │(AmazonMQ)    │  │   (Elastic)  │                                      │ │
│  │  └──────────────┘  └──────────────┘                                      │ │
│  │                                                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Monitoring & Observability

### 11.1 Metrics to Track

**Application Metrics**
- Request rate (requests/second per service)
- Error rate (4xx, 5xx responses)
- Response latency (p50, p95, p99)
- Active sessions count
- Tasks in progress
- Review queue depth

**Business Metrics**
- Tasks completed per hour
- Average quality scores
- Average task completion time
- Reviewer throughput
- Annotator productivity

**Infrastructure Metrics**
- CPU/Memory usage per service
- Database connections
- Cache hit ratio
- Message queue depth
- Storage usage

### 11.2 Logging Strategy

```typescript
// Structured logging format
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  trace_id: string;
  span_id: string;
  user_id?: string;
  message: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}

// Example log entry
{
  "timestamp": "2026-04-19T10:30:00.000Z",
  "level": "info",
  "service": "task-service",
  "trace_id": "abc123",
  "span_id": "def456",
  "user_id": "usr_001",
  "message": "Task submitted successfully",
  "metadata": {
    "task_id": "task_001",
    "batch_id": "batch_002",
    "duration_ms": 45
  }
}
```

### 11.3 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | 5xx > 1% for 5 min | Critical |
| Slow Response | p95 latency > 2s for 5 min | Warning |
| Service Down | Health check failed for 1 min | Critical |
| Queue Backlog | Messages > 10000 for 10 min | Warning |
| Database Connections | Connections > 80% max | Warning |
| Review Backlog | Pending reviews > 100 for 1 hour | Info |

---

## Appendix A: Frontend-Backend Contract

### A.1 API Endpoint Mapping

| Frontend Page | Backend Endpoints |
|---------------|-------------------|
| Login | `POST /auth/login`, `POST /auth/verify-otp` |
| Dashboard | `GET /analytics/dashboard`, `GET /batches`, `GET /tasks/my`, `GET /notifications` |
| Batches List | `GET /batches` |
| Batch Detail | `GET /batches/:id`, `GET /batches/:id/tasks` |
| Tasks List | `GET /tasks/my` |
| Task Detail | `GET /tasks/:id`, `GET /sessions`, `GET /reviews` |
| Sessions | `GET /sessions`, `POST /sessions/:id/events` |
| Reviews | `GET /reviews`, `POST /reviews/:id/*` |
| Reports | `GET /analytics/*` |
| Settings | `GET/PUT /users/:id`, `GET/PUT /notifications/preferences` |

### A.2 WebSocket Events

```typescript
// Real-time updates
interface WebSocketEvents {
  // Notifications
  'notification:new': Notification;
  'notification:read': { id: string };
  
  // Task updates
  'task:status_changed': { task_id: string; status: string };
  'task:assigned': { task_id: string; batch_id: string };
  
  // Review updates
  'review:completed': { review_id: string; task_id: string; status: string };
  
  // Session updates (extension)
  'session:event_recorded': { session_id: string; event_count: number };
}
```

---

## Appendix B: Security Considerations

1. **Data Encryption**: All data encrypted at rest (AES-256) and in transit (TLS 1.3)
2. **Rate Limiting**: Implemented at API Gateway level
3. **Input Validation**: All inputs validated and sanitized
4. **SQL Injection**: Parameterized queries only
5. **XSS Prevention**: Content Security Policy headers
6. **CORS**: Strict origin validation
7. **Secrets Management**: HashiCorp Vault or AWS Secrets Manager
8. **Audit Logging**: All sensitive operations logged
9. **Session Management**: Secure, HTTP-only cookies with short expiry
10. **2FA**: Required for all users

---

*Document Version: 1.0*
*Last Updated: April 2026*
*Author: LabelForge Architecture Team*
