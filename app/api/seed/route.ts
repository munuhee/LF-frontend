import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'
import Task from '@/lib/models/Task'
import Review from '@/lib/models/Review'
import Notification from '@/lib/models/Notification'

export async function POST() {
  try {
    await connectToDatabase()

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Workflow.deleteMany({}),
      Batch.deleteMany({}),
      Task.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ])

    // Create users
    const [annotatorPw, reviewerPw, adminPw] = await Promise.all([
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('admin123!', 12),
    ])

    const [annotator, reviewer, admin] = await User.insertMany([
      {
        name: 'Alex Chen',
        email: 'alex.chen@labelforge.ai',
        passwordHash: annotatorPw,
        role: 'annotator',
        department: 'AI Data Team',
        badges: [
          { type: 'role', name: 'Annotator', description: 'Certified annotator', awardedAt: new Date() },
          { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist', awardedAt: new Date() },
          { type: 'level', name: 'Intermediate', description: 'Intermediate level', awardedAt: new Date() },
        ],
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@labelforge.ai',
        passwordHash: reviewerPw,
        role: 'reviewer',
        department: 'Quality Assurance',
        badges: [
          { type: 'role', name: 'Reviewer', description: 'Certified reviewer', awardedAt: new Date() },
          { type: 'level', name: 'Senior', description: 'Senior reviewer', awardedAt: new Date() },
        ],
      },
      {
        name: 'Michael Park',
        email: 'michael.park@labelforge.ai',
        passwordHash: adminPw,
        role: 'admin',
        department: 'Operations',
        badges: [
          { type: 'role', name: 'Admin', description: 'Platform administrator', awardedAt: new Date() },
        ],
      },
    ])

    // Create workflows — assign both annotator and reviewer to each
    const [agenticWorkflow, llmWorkflow] = await Workflow.insertMany([
      {
        name: 'Agentic AI Evaluation',
        description: 'Evaluate and train AI agents on web-based tasks',
        type: 'agentic-ai',
        isActive: true,
        assignedUsers: [annotator._id, reviewer._id],
        createdBy: admin._id,
      },
      {
        name: 'LLM Response Training',
        description: 'Train large language models with high-quality responses',
        type: 'llm-training',
        isActive: true,
        assignedUsers: [annotator._id, reviewer._id],
        createdBy: admin._id,
      },
    ])

    // Create batches
    const [batch1, batch2] = await Batch.insertMany([
      {
        workflowId: agenticWorkflow._id,
        workflowName: 'Agentic AI Evaluation',
        title: 'Agent Task Completion - Web Navigation',
        description: 'Complete complex multi-step tasks on external websites to train agentic AI behaviors',
        instructions: '1. Open the external URL\n2. Complete the assigned task\n3. Capture screenshots at each step\n4. Submit with detailed notes',
        taskType: 'agentic-ai',
        priority: 0.95,
        workloadEstimate: 40,
        status: 'available',
        tasksTotal: 3,
        tasksCompleted: 0,
        createdBy: admin._id,
        assignedAnnotators: [annotator._id],
      },
      {
        workflowId: llmWorkflow._id,
        workflowName: 'LLM Response Training',
        title: 'Instruction Following - General Tasks',
        description: 'Provide high-quality responses to diverse instruction sets for LLM fine-tuning',
        instructions: '1. Read each instruction carefully\n2. Write a complete, accurate response\n3. Follow all formatting guidelines\n4. Submit for QA review',
        taskType: 'llm-training',
        priority: 0.75,
        workloadEstimate: 20,
        status: 'available',
        tasksTotal: 2,
        tasksCompleted: 0,
        createdBy: admin._id,
      },
    ])

    // Create tasks
    const task1 = await Task.create({
      batchId: batch1._id,
      batchTitle: batch1.title,
      workflowId: agenticWorkflow._id,
      workflowName: 'Agentic AI Evaluation',
      title: 'Search and book a hotel on Booking.com',
      description: 'Navigate to Booking.com and search for a hotel in New York for 2 adults, 2 nights. Filter by rating ≥ 8.0, select a hotel, and capture the booking details page.',
      taskType: 'agentic-ai',
      status: 'unclaimed',
      priority: 0.95,
      externalUrl: 'https://www.booking.com',
      estimatedDuration: 25,
    })

    const task2 = await Task.create({
      batchId: batch1._id,
      batchTitle: batch1.title,
      workflowId: agenticWorkflow._id,
      workflowName: 'Agentic AI Evaluation',
      title: 'Find cheapest round-trip flight on Google Flights',
      description: 'Go to Google Flights and find the cheapest round-trip flight from London (LHR) to New York (JFK) for next month, economy class. Screenshot the results.',
      taskType: 'agentic-ai',
      status: 'submitted',
      priority: 0.9,
      externalUrl: 'https://www.google.com/flights',
      estimatedDuration: 30,
      annotatorId: annotator._id,
      annotatorEmail: annotator.email,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      actualDuration: 28,
      notes: 'Found the cheapest option on day 3. Had to navigate through 3 pages.',
    })

    const task3 = await Task.create({
      batchId: batch1._id,
      batchTitle: batch1.title,
      workflowId: agenticWorkflow._id,
      workflowName: 'Agentic AI Evaluation',
      title: 'Add product to cart and reach checkout on Amazon',
      description: 'Go to Amazon.com, search for "wireless headphones under $50", add the top-rated result to cart, and navigate to the checkout page. Screenshot each step.',
      taskType: 'agentic-ai',
      status: 'approved',
      priority: 0.85,
      externalUrl: 'https://www.amazon.com',
      estimatedDuration: 20,
      annotatorId: annotator._id,
      annotatorEmail: annotator.email,
      reviewerId: reviewer._id,
      reviewerEmail: reviewer.email,
      qualityScore: 92,
      feedback: 'Excellent task completion with clear screenshots and notes.',
      startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actualDuration: 18,
    })

    const task4 = await Task.create({
      batchId: batch2._id,
      batchTitle: batch2.title,
      workflowId: llmWorkflow._id,
      workflowName: 'LLM Response Training',
      title: 'Write response to coding question',
      description: 'Provide a detailed, accurate response to: "Explain the difference between async/await and Promises in JavaScript"',
      taskType: 'llm-training',
      status: 'unclaimed',
      priority: 0.75,
      estimatedDuration: 15,
    })

    const task5 = await Task.create({
      batchId: batch2._id,
      batchTitle: batch2.title,
      workflowId: llmWorkflow._id,
      workflowName: 'LLM Response Training',
      title: 'Summarise scientific article',
      description: 'Read the provided article abstract and write a clear 3-paragraph summary suitable for a general audience.',
      taskType: 'llm-training',
      status: 'unclaimed',
      priority: 0.7,
      estimatedDuration: 20,
    })

    // Update batch tasksTotal
    await Batch.findByIdAndUpdate(batch1._id, { tasksTotal: 3, tasksCompleted: 1 })
    await Batch.findByIdAndUpdate(batch2._id, { tasksTotal: 2, tasksCompleted: 0 })

    // Create a review for submitted task
    const review = await Review.create({
      taskId: task2._id,
      taskTitle: task2.title,
      batchId: batch1._id,
      batchTitle: batch1.title,
      workflowId: agenticWorkflow._id,
      annotatorId: annotator._id,
      annotatorEmail: annotator.email,
      annotatorName: annotator.name,
      status: 'pending',
      submittedAt: task2.submittedAt,
    })

    // Create review for approved task
    await Review.create({
      taskId: task3._id,
      taskTitle: task3.title,
      batchId: batch1._id,
      batchTitle: batch1.title,
      workflowId: agenticWorkflow._id,
      annotatorId: annotator._id,
      annotatorEmail: annotator.email,
      annotatorName: annotator.name,
      reviewerId: reviewer._id,
      reviewerEmail: reviewer.email,
      reviewerName: reviewer.name,
      status: 'approved',
      decision: 'approve',
      qualityScore: 92,
      criteriaScores: { accuracy: 95, completeness: 90, adherence: 91 },
      comments: 'Excellent task completion with clear screenshots and notes.',
      submittedAt: task3.submittedAt,
      reviewedAt: task3.completedAt,
    })

    // Create notifications
    await Notification.insertMany([
      {
        userId: annotator._id,
        type: 'batch-assigned',
        title: 'New Batch Available',
        message: 'You have been assigned to "Agent Task Completion - Web Navigation". Start working on it now.',
        actionUrl: `/dashboard/workflows/${agenticWorkflow._id}`,
        read: false,
      },
      {
        userId: annotator._id,
        type: 'task-approved',
        title: 'Task Approved',
        message: 'Your task "Complete online checkout flow" was approved with a score of 92%.',
        actionUrl: `/dashboard/tasks/${task3._id}`,
        read: false,
      },
      {
        userId: reviewer._id,
        type: 'review-needed',
        title: 'Review Required',
        message: 'Task "Search and compare flight prices" has been submitted and needs your review.',
        actionUrl: `/dashboard/reviews`,
        read: false,
      },
    ])

    return NextResponse.json({
      message: 'Database seeded successfully',
      credentials: {
        annotator: { email: 'alex.chen@labelforge.ai', password: 'annotator123!' },
        reviewer: { email: 'sarah.johnson@labelforge.ai', password: 'reviewer123!' },
        admin: { email: 'michael.park@labelforge.ai', password: 'admin123!' },
      },
    })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: 'Seed failed', details: String(err) }, { status: 500 })
  }
}
