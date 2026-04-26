import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import Review from '@/lib/models/Review'
import Notification from '@/lib/models/Notification'
import { randomUUID } from 'crypto'

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
    isLocked: t.isLocked ?? false,
    priority: t.priority,
    difficulty: t.difficulty,
    languageTags: t.languageTags,
    sla: t.sla,
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
    objective: t.objective,
    successCriteria: t.successCriteria,
    expectedOutput: t.expectedOutput,
    subtasks: t.subtasks,
    submissionData: t.submissionData,
    screenshots: t.screenshots,
    extensionData: t.extensionData,
    errorTags: t.errorTags ?? [],
    activityLog: t.activityLog ?? [],
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    submittedAt: t.submittedAt,
    signedOffAt: t.signedOffAt,
    createdAt: t.createdAt,
  }
}

function log(userId: string, userEmail: string, action: string, comment?: string) {
  return { action, userId, userEmail, comment, timestamp: new Date() }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const task = await Task.findById(id).lean()
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const review = await Review.findOne({ taskId: id }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      ...serializeTask(task as unknown as Record<string, unknown>),
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

    const { action } = body

    // Locked tasks are immutable
    if (task.isLocked && !['add-error-tag', 'remove-error-tag', 'resolve-error-tag'].includes(action)) {
      return NextResponse.json({ error: 'This task is locked and cannot be modified' }, { status: 403 })
    }

    // ─── Annotator actions ────────────────────────────────────────────────────

    if (action === 'claim') {
      if (task.status !== 'unclaimed') {
        return NextResponse.json({ error: 'Task is not available to claim' }, { status: 400 })
      }
      // One-at-a-time: block if annotator has an in-progress OR revision-requested task
      const blocking = await Task.findOne({
        annotatorId: userId,
        status: { $in: ['in-progress', 'paused'] },
      })
      if (blocking) {
        return NextResponse.json({ error: 'Complete your current in-progress task before claiming a new one' }, { status: 400 })
      }
      const needsRework = await Task.findOne({ annotatorId: userId, status: 'revision-requested' })
      if (needsRework) {
        return NextResponse.json({ error: 'You have a task requiring rework. Complete it before claiming a new one' }, { status: 400 })
      }
      task.annotatorId = userId as unknown as typeof task.annotatorId
      task.annotatorEmail = userEmail
      task.status = 'in-progress'
      task.startedAt = new Date()
      task.activityLog.push(log(userId, userEmail, 'claimed'))
      await Batch.findByIdAndUpdate(task.batchId, { status: 'in-progress' })

    } else if (action === 'pause') {
      task.status = 'paused'
      task.activityLog.push(log(userId, userEmail, 'paused'))

    } else if (action === 'resume') {
      // One-at-a-time check (can still resume their OWN paused task)
      task.status = 'in-progress'
      task.activityLog.push(log(userId, userEmail, 'resumed'))

    } else if (action === 'park') {
      const comment = body.parkComment || ''
      task.status = 'paused'
      if (comment) task.notes = `[PARKED] ${comment}`
      task.activityLog.push(log(userId, userEmail, 'parked', comment))

    } else if (action === 'submit') {
      const wasRevisionRequested = task.status === 'revision-requested'
      task.status = 'submitted'
      task.submittedAt = new Date()
      if (body.notes) task.notes = body.notes
      task.activityLog.push(log(userId, userEmail, 'resubmitted-after-rework', body.notes))

      if (wasRevisionRequested) {
        // Reset the existing review back to pending so the same reviewer sees it again
        // Keep error tags on the task — reviewer will mark them resolved when satisfied
        const existingReview = await Review.findOne({ taskId: task._id, status: 'revision-requested' })
        if (existingReview) {
          existingReview.status = 'pending'
          existingReview.decision = undefined
          existingReview.submittedAt = new Date()
          await existingReview.save()
        } else {
          // Fallback: create fresh review if none found
          await Review.create({
            taskId: task._id, taskTitle: task.title, batchId: task.batchId,
            batchTitle: task.batchTitle, workflowId: task.workflowId,
            annotatorId: userId, annotatorEmail: userEmail,
            annotatorName: userEmail.split('@')[0], status: 'pending', submittedAt: new Date(),
          })
        }
      } else {
        // First-time submission: create a new review
        await Review.create({
          taskId: task._id, taskTitle: task.title, batchId: task.batchId,
          batchTitle: task.batchTitle, workflowId: task.workflowId,
          annotatorId: userId, annotatorEmail: userEmail,
          annotatorName: userEmail.split('@')[0], status: 'pending', submittedAt: new Date(),
        })
      }

    } else if (action === 'recall') {
      const pendingReview = await Review.findOne({ taskId: id, status: 'pending' })
      if (!pendingReview) {
        return NextResponse.json({ error: 'Task is already in review — cannot recall' }, { status: 400 })
      }
      await Review.findByIdAndDelete(pendingReview._id)
      task.status = 'in-progress'
      task.submittedAt = undefined
      task.activityLog.push(log(userId, userEmail, 'recalled', 'Pulled back for edits'))

    } else if (action === 'escalate') {
      const comment = body.comment || ''
      task.status = 'escalated'
      task.activityLog.push(log(userId, userEmail, 'escalated', comment))
      // Notify reviewer if assigned; otherwise notify the annotator's own record is not useful —
      // skip notification when no reviewer is available yet (admin will see it on the dashboard)
      if (task.reviewerId) {
        await Notification.create({
          userId: task.reviewerId,
          type: 'escalation',
          title: 'Task Escalated by Annotator',
          message: `${userEmail.split('@')[0]} escalated "${task.title}": ${comment}`,
          actionUrl: `/dashboard/tasks/${task._id}`,
        })
      }

    } else if (action === 'unenroll') {
      task.status = 'unclaimed'
      task.annotatorId = undefined
      task.annotatorEmail = undefined
      task.activityLog.push(log(userId, userEmail, 'unenrolled'))

    // ─── Reviewer / Admin actions ─────────────────────────────────────────────

    } else if (action === 'sign-off') {
      // Task becomes data-ready and immutable
      if (role !== 'reviewer' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const qualityScore = body.qualityScore ?? 100
      task.status = 'data-ready'
      task.isLocked = true
      task.qualityScore = qualityScore
      task.feedback = body.comments || ''
      task.completedAt = new Date()
      task.signedOffAt = new Date()
      task.reviewerId = userId as unknown as typeof task.reviewerId
      task.reviewerEmail = userEmail
      task.activityLog.push(log(userId, userEmail, 'signed-off', body.comments))

      // Mark all error tags as resolved
      task.errorTags.forEach(tag => {
        if (tag.status === 'open') {
          tag.status = 'resolved'
          tag.resolvedBy = userEmail
          tag.resolvedAt = new Date()
        }
      })

      // Update review record
      await Review.findOneAndUpdate(
        { taskId: task._id, status: 'in-review' },
        { status: 'approved', decision: 'approve', qualityScore, reviewedAt: new Date(), comments: body.comments }
      )
      // Increment batch completion
      await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksCompleted: 1 } })

      await Notification.create({
        userId: task.annotatorId,
        type: 'task-approved',
        title: 'Task Signed Off — Data Ready',
        message: `Your task "${task.title}" has been signed off and is now in the training dataset.`,
        actionUrl: `/dashboard/tasks/${task._id}`,
      })

    } else if (action === 'request-rework') {
      if (role !== 'reviewer' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const comment = body.comment || ''
      task.status = 'revision-requested'
      task.feedback = comment
      task.activityLog.push(log(userId, userEmail, 'requested-rework', comment))

      await Review.findOneAndUpdate(
        { taskId: task._id, status: 'in-review' },
        { status: 'revision-requested', decision: 'request-rework', comments: comment, reviewedAt: new Date() }
      )

      await Notification.create({
        userId: task.annotatorId,
        type: 'task-rejected',
        title: 'Rework Required',
        message: `Your task "${task.title}" needs rework. Reviewer: ${comment}`,
        actionUrl: `/dashboard/tasks/${task._id}`,
      })

    // ─── Error tag CRUD (reviewer only) ──────────────────────────────────────

    } else if (action === 'add-error-tag') {
      if (role !== 'reviewer' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { tag } = body
      task.errorTags.push({
        tagId: tag.tagId ?? randomUUID(),
        severity: tag.severity,
        category: tag.category,
        message: tag.message,
        stepReference: tag.stepReference,
        scoreDeduction: tag.scoreDeduction ?? (tag.severity === 'major' ? 20 : 5),
        status: 'open',
        createdBy: userId,
        createdByEmail: userEmail,
      })
      task.activityLog.push(log(userId, userEmail, 'added-error-tag', `[${tag.severity.toUpperCase()}] ${tag.message}`))

    } else if (action === 'remove-error-tag') {
      if (role !== 'reviewer' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      task.errorTags = task.errorTags.filter(t => t.tagId !== body.tagId) as typeof task.errorTags
      task.activityLog.push(log(userId, userEmail, 'removed-error-tag', body.tagId))

    } else if (action === 'resolve-error-tag') {
      if (role !== 'reviewer' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const tag = task.errorTags.find(t => t.tagId === body.tagId)
      if (tag) {
        tag.status = 'resolved'
        tag.resolvedBy = userEmail
        tag.resolvedAt = new Date()
        task.activityLog.push(log(userId, userEmail, 'resolved-error-tag', tag.message))
      }

    } else if (action === 'complete') {
      task.status = 'approved'
      task.completedAt = new Date()
      task.activityLog.push(log(userId, userEmail, 'completed'))
      await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksCompleted: 1 } })

    } else {
      Object.assign(task, body)
    }

    await task.save()
    return NextResponse.json(serializeTask(task.toObject() as unknown as Record<string, unknown>))
  } catch (err) {
    console.error('[tasks/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    const task = await Task.findById(id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (task.isLocked) return NextResponse.json({ error: 'Cannot delete a locked task' }, { status: 403 })
    await task.deleteOne()
    await Batch.findByIdAndUpdate(task.batchId, { $inc: { tasksTotal: -1 } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
