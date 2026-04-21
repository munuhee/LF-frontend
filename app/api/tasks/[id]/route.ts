import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import Review from '@/lib/models/Review'
import Notification from '@/lib/models/Notification'

function serializeTask(t: Record<string, unknown>) {
  return {
    id: (t._id as { toString(): string }).toString(),
    batchId: (t.batchId as { toString(): string }).toString(),
    batchTitle: t.batchTitle,
    workflowId: (t.workflowId as { toString(): string }).toString(),
    workflowName: t.workflowName,
    title: t.title,
    description: t.description,
    taskType: t.taskType,
    status: t.status,
    priority: t.priority,
    externalUrl: t.externalUrl,
    estimatedDuration: t.estimatedDuration,
    actualDuration: t.actualDuration,
    annotatorId: t.annotatorId ? (t.annotatorId as { toString(): string }).toString() : null,
    annotatorEmail: t.annotatorEmail,
    reviewerId: t.reviewerId ? (t.reviewerId as { toString(): string }).toString() : null,
    reviewerEmail: t.reviewerEmail,
    feedback: t.feedback,
    qualityScore: t.qualityScore,
    notes: t.notes,
    submissionData: t.submissionData,
    screenshots: t.screenshots,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    submittedAt: t.submittedAt,
    createdAt: t.createdAt,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const task = await Task.findById(id).lean()
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const review = await Review.findOne({ taskId: id }).lean()

    return NextResponse.json({
      ...serializeTask(task as Record<string, unknown>),
      review: review ? {
        id: review._id.toString(),
        status: review.status,
        decision: review.decision,
        comments: review.comments,
        qualityScore: review.qualityScore,
        criteriaScores: review.criteriaScores,
        reviewerName: review.reviewerName,
        reviewedAt: review.reviewedAt,
      } : null,
    })
  } catch (err) {
    console.error('[tasks/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id')!
    const userEmail = req.headers.get('x-user-email')!
    const role = req.headers.get('x-user-role')!
    const body = await req.json()

    await connectToDatabase()
    const task = await Task.findById(id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { action, notes } = body

    if (action === 'claim') {
      if (task.status !== 'unclaimed') return NextResponse.json({ error: 'Task not available' }, { status: 400 })
      task.annotatorId = userId as unknown as typeof task.annotatorId
      task.annotatorEmail = userEmail
      task.status = 'in-progress'
      task.startedAt = new Date()
      await Batch.findByIdAndUpdate(task.batchId, { status: 'in-progress' })
    } else if (action === 'pause') {
      task.status = 'paused'
    } else if (action === 'resume') {
      task.status = 'in-progress'
    } else if (action === 'submit') {
      task.status = 'submitted'
      task.submittedAt = new Date()
      if (notes) task.notes = notes

      // Create review record
      const review = await Review.create({
        taskId: task._id,
        taskTitle: task.title,
        batchId: task.batchId,
        batchTitle: task.batchTitle,
        workflowId: task.workflowId,
        annotatorId: userId,
        annotatorEmail: userEmail,
        annotatorName: userEmail.split('@')[0],
        status: 'pending',
        submittedAt: new Date(),
      })
    } else if (action === 'complete') {
      task.status = 'approved'
      task.completedAt = new Date()
      await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksCompleted: 1 } })
    } else {
      // Generic update
      Object.assign(task, body)
    }

    await task.save()
    return NextResponse.json(serializeTask(task.toObject()))
  } catch (err) {
    console.error('[tasks/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const task = await Task.findByIdAndDelete(id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksTotal: -1 } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
