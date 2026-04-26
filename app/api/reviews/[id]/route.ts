import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/lib/models/Review'
import Task from '@/lib/models/Task'
import Notification from '@/lib/models/Notification'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const review = await Review.findById(id).lean()
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: review._id.toString(), ...review })
  } catch {
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

    const { action } = body

    if (action === 'claim') {
      // Enforce one-at-a-time for reviewers
      const active = await Review.countDocuments({ reviewerId: userId, status: 'in-review' })
      if (active >= 1) {
        return NextResponse.json({ error: 'Complete your current active review before claiming another' }, { status: 400 })
      }
      review.reviewerId = userId as unknown as typeof review.reviewerId
      review.reviewerEmail = userEmail
      review.reviewerName = userEmail.split('@')[0]
      review.status = 'in-review'
      // Set task reviewerId
      await Task.findByIdAndUpdate(review.taskId, {
        reviewerId: userId,
        reviewerEmail: userEmail,
        status: 'in-review',
      })

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
        // Delegate to task sign-off logic (sets data-ready + locks)
        const task = await Task.findById(review.taskId)
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
          await require('@/lib/models/Batch').default.findByIdAndUpdate(task.batchId, { $inc: { tasksCompleted: 1 } })
        }
        review.status = 'approved'
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-approved',
          title: 'Task Signed Off — Data Ready',
          message: `Your task "${review.taskTitle}" is now in the training dataset.`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })

      } else if (decision === 'reject') {
        review.status = 'rejected'
        const task = await Task.findById(review.taskId)
        if (task) {
          task.status = 'rejected'
          task.feedback = comments
          if (errorTags?.length) task.errorTags.push(...errorTags)
          task.activityLog.push({ action: 'rejected', userId, userEmail, comment: comments, timestamp: new Date() })
          await task.save()
        }
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-rejected',
          title: 'Task Rejected',
          message: `Your task "${review.taskTitle}" was rejected. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })

      } else if (decision === 'request-rework') {
        review.status = 'revision-requested'
        const task = await Task.findById(review.taskId)
        if (task) {
          task.status = 'revision-requested'
          task.feedback = comments
          if (errorTags?.length) task.errorTags.push(...errorTags)
          task.activityLog.push({ action: 'revision-requested', userId, userEmail, comment: comments, timestamp: new Date() })
          await task.save()
        }
        await Notification.create({
          userId: review.annotatorId,
          type: 'task-rejected',
          title: 'Rework Required',
          message: `Your task "${review.taskTitle}" needs rework. ${comments || ''}`,
          actionUrl: `/dashboard/tasks/${review.taskId}`,
        })

      } else if (decision === 'escalate') {
        review.status = 'escalated'
        await Task.findByIdAndUpdate(review.taskId, { status: 'submitted', feedback: comments })
        await Notification.create({
          userId: review.annotatorId,
          type: 'escalation',
          title: 'Task Escalated',
          message: `Your task "${review.taskTitle}" has been escalated. ${comments || ''}`,
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
          title: 'Task Flagged',
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
