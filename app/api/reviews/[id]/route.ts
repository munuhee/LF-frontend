import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/lib/models/Review'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import Notification from '@/lib/models/Notification'
import { requireTenant, isReviewerOrAbove, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const rf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const review = await Review.findOne({ _id: id, ...rf }).lean()
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: review._id.toString(), ...review })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    const { userId, email: userEmail, role, tenantId } = ctx
    const clientSlug = req.headers.get('x-client-slug') ?? ''

    if (!isReviewerOrAbove(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    await connectToDatabase()
    const review = await Review.findOne({ _id: id, tenantId })
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { action } = body
    const taskUrl = `/${clientSlug}/dashboard/tasks/${review.taskId}`

    if (action === 'claim') {
      const active = await Review.countDocuments({ tenantId, reviewerId: userId, status: 'in-review' })
      if (active >= 1) {
        return NextResponse.json({ error: 'Complete your current active review before claiming another' }, { status: 400 })
      }
      review.reviewerId = userId as unknown as typeof review.reviewerId
      review.reviewerEmail = userEmail
      review.reviewerName = userEmail.split('@')[0]
      review.status = 'in-review'
      await Task.findOneAndUpdate(
        { _id: review.taskId, tenantId },
        { reviewerId: userId, reviewerEmail: userEmail, status: 'in-review' }
      )

    } else if (action === 'decide') {
      const { decision, comments, reasonCode, qualityScore, criteriaScores, errorTags } = body
      review.decision = decision
      review.comments = comments
      review.reasonCode = reasonCode
      review.qualityScore = qualityScore
      review.criteriaScores = criteriaScores
      review.reviewedAt = new Date()
      if (errorTags?.length) review.errorTags = errorTags

      if (decision === 'approve') {
        const task = await Task.findOne({ _id: review.taskId, tenantId })
        if (task) {
          task.status = 'data-ready'
          task.isLocked = true
          task.qualityScore = qualityScore
          task.feedback = comments
          task.completedAt = new Date()
          task.signedOffAt = new Date()
          task.errorTags.forEach(tag => {
            if (tag.status === 'open') { tag.status = 'resolved'; tag.resolvedBy = userEmail; tag.resolvedAt = new Date() }
          })
          task.activityLog.push({ action: 'signed-off', userId, userEmail, comment: comments, timestamp: new Date() })
          await task.save()
          await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksCompleted: 1 } })
        }
        review.status = 'approved'
        await Notification.create({
          tenantId, userId: review.annotatorId, type: 'task-approved',
          title: 'Task Signed Off — Data Ready',
          message: `Your task "${review.taskTitle}" is now in the training dataset.`,
          actionUrl: taskUrl,
        })

      } else if (decision === 'reject') {
        review.status = 'rejected'
        const task = await Task.findOne({ _id: review.taskId, tenantId })
        if (task) {
          task.status = 'rejected'
          task.feedback = comments
          if (errorTags?.length) task.errorTags.push(...errorTags)
          task.activityLog.push({ action: 'rejected', userId, userEmail, comment: comments, timestamp: new Date() })
          await task.save()
        }
        await Notification.create({
          tenantId, userId: review.annotatorId, type: 'task-rejected',
          title: 'Task Rejected',
          message: `Your task "${review.taskTitle}" was rejected. ${comments || ''}`,
          actionUrl: taskUrl,
        })

      } else if (decision === 'request-rework') {
        review.status = 'revision-requested'
        const task = await Task.findOne({ _id: review.taskId, tenantId })
        if (task) {
          task.status = 'revision-requested'
          task.feedback = comments
          if (errorTags?.length) task.errorTags.push(...errorTags)
          task.activityLog.push({ action: 'revision-requested', userId, userEmail, comment: comments, timestamp: new Date() })
          await task.save()
        }
        await Notification.create({
          tenantId, userId: review.annotatorId, type: 'task-rejected',
          title: 'Rework Required',
          message: `Your task "${review.taskTitle}" needs rework. ${comments || ''}`,
          actionUrl: taskUrl,
        })

      } else if (decision === 'escalate') {
        review.status = 'escalated'
        await Task.findOneAndUpdate({ _id: review.taskId, tenantId }, { status: 'submitted', feedback: comments })
        await Notification.create({
          tenantId, userId: review.annotatorId, type: 'escalation',
          title: 'Task Escalated',
          message: `Your task "${review.taskTitle}" has been escalated. ${comments || ''}`,
          actionUrl: taskUrl,
        })

      } else if (decision === 'hold') {
        review.status = 'on-hold'
        await Task.findOneAndUpdate({ _id: review.taskId, tenantId }, { status: 'submitted', feedback: comments })

      } else if (decision === 'flag') {
        review.status = 'flagged'
        await Task.findOneAndUpdate({ _id: review.taskId, tenantId }, { status: 'submitted', feedback: comments })
        await Notification.create({
          tenantId, userId: review.annotatorId, type: 'priority-warning',
          title: 'Task Flagged',
          message: `Your task "${review.taskTitle}" has been flagged. ${comments || ''}`,
          actionUrl: taskUrl,
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
