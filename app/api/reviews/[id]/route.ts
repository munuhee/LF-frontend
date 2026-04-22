import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/lib/models/Review'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import Notification from '@/lib/models/Notification'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const review = await Review.findById(id).lean()
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: review._id.toString(), ...review })
  } catch (err) {
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

    if (role !== 'reviewer' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()
    const review = await Review.findById(id)
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { action, decision, comments, reasonCode, qualityScore, criteriaScores } = body

    if (action === 'claim') {
      // Check reviewer task limit (max 2 active)
      const activeCount = await Review.countDocuments({ reviewerId: userId, status: 'in-review' })
      if (activeCount >= 2) {
        return NextResponse.json({ error: 'You have reached the maximum of 2 active reviews' }, { status: 400 })
      }
      review.reviewerId = userId as unknown as typeof review.reviewerId
      review.reviewerEmail = userEmail
      review.reviewerName = userEmail.split('@')[0]
      review.status = 'in-review'
    } else if (action === 'decide') {
      review.decision = decision
      review.comments = comments
      review.reasonCode = reasonCode
      review.qualityScore = qualityScore
      review.criteriaScores = criteriaScores
      review.reviewedAt = new Date()

      if (decision === 'approve') {
        review.status = 'approved'
        await Task.findByIdAndUpdate(review.taskId, {
          status: 'approved',
          qualityScore,
          feedback: comments,
          completedAt: new Date(),
        })
        await Batch.findByIdAndUpdate(review.batchId, { $inc: { tasksCompleted: 1 } })
        // Notify annotator
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-approved',
          title: 'Task Approved',
          message: `Your task "${review.taskTitle}" has been approved${qualityScore ? ` with a score of ${qualityScore}%` : ''}.`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })
      } else if (decision === 'reject') {
        review.status = 'rejected'
        await Task.findByIdAndUpdate(review.taskId, { status: 'rejected', feedback: comments })
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-rejected',
          title: 'Task Rejected',
          message: `Your task "${review.taskTitle}" was rejected. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })
      } else if (decision === 'request-rework') {
        review.status = 'revision-requested'
        await Task.findByIdAndUpdate(review.taskId, { status: 'revision-requested', feedback: comments })
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-rejected',
          title: 'Revision Requested',
          message: `Your task "${review.taskTitle}" needs revision. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })
      } else if (decision === 'escalate') {
        review.status = 'escalated'
        await Task.findByIdAndUpdate(review.taskId, { status: 'submitted', feedback: comments })
        // Notify annotator
        await Notification.create({
          userId: review.annotatorId,
          type: 'escalation',
          title: 'Task Escalated',
          message: `Your task "${review.taskTitle}" has been escalated for further review. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })
      } else if (decision === 'hold') {
        review.status = 'on-hold'
        await Task.findByIdAndUpdate(review.taskId, { status: 'submitted', feedback: comments })
      } else if (decision === 'flag') {
        review.status = 'flagged'
        await Task.findByIdAndUpdate(review.taskId, { status: 'submitted', feedback: comments })
        await Notification.create({
          userId: review.annotatorId,
          type: 'priority-warning',
          title: 'Task Flagged for Investigation',
          message: `Your task "${review.taskTitle}" has been flagged. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })
      }
    }

    await review.save()
    return NextResponse.json({ id: review._id.toString(), ...review.toObject() })
  } catch (err) {
    console.error('[reviews/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
