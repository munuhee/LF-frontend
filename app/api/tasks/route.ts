import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import { requireTenant, isClientAdmin, isSuperAdmin, isReviewerOrAbove, isValidObjectId } from '@/lib/tenant'

function serializeTask(t: Record<string, unknown>) {
  return {
    id: (t._id as { toString(): string }).toString(),
    tenantId: (t.tenantId as { toString(): string } | undefined)?.toString(),
    projectId: (t.projectId as { toString(): string } | undefined)?.toString(),
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
    objective: t.objective,
    successCriteria: t.successCriteria,
    expectedOutput: t.expectedOutput,
    subtasks: t.subtasks,
    submissionData: t.submissionData,
    screenshots: t.screenshots,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    submittedAt: t.submittedAt,
    createdAt: t.createdAt,
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const { userId, role } = ctx
    let { tenantId } = ctx

    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')
    const projectId = searchParams.get('projectId')
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')
    // Admin / qa_lead advanced filters
    const workflow = searchParams.get('workflow')
    const annotatorEmail = searchParams.get('annotatorEmail')
    const reviewerEmail = searchParams.get('reviewerEmail')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateExact = searchParams.get('dateExact')

    // Resolve tenantId for super_admin who may pass clientSlug/clientId as query param
    if (!isValidObjectId(tenantId) && isSuperAdmin(role)) {
      if (clientSlugParam) {
        const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
        if (client) tenantId = (client._id as { toString(): string }).toString()
      } else if (clientIdParam && isValidObjectId(clientIdParam)) {
        tenantId = clientIdParam
      }
    }

    // Scope to current workspace; if super_admin has no tenant context, show all
    const filter: Record<string, unknown> = isValidObjectId(tenantId) ? { tenantId } : {}
    if (batchId) filter.batchId = batchId
    if (projectId) filter.projectId = projectId

    if (status && status !== 'all') {
      const statuses = status.split(',').map(s => s.trim())
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    const viewAs = searchParams.get('viewAs') // 'annotator' | 'reviewer'

    // Scope tasks to the requesting user where needed
    if (role === 'annotator' || (role === 'reviewer_annotator' && viewAs === 'annotator')) {
      filter.annotatorId = userId
    } else if (mine === 'true' && (role === 'reviewer' || role === 'reviewer_annotator')) {
      filter.reviewerId = userId
    }

    // Advanced filters for reviewers and above
    if (isReviewerOrAbove(role)) {
      if (workflow) {
        const flexRegex = (term: string) => {
          const pattern = term.trim().split(/[-_\s]+/)
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[\\s\\-_]+')
          return new RegExp(pattern, 'i')
        }
        const names = workflow.split(',').map(s => s.trim())
        filter.$or = names.flatMap(n => [
          { workflowName: flexRegex(n) },
          { taskType: { $regex: n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ])
      }
      if (isClientAdmin(role)) {
        if (annotatorEmail) {
          const emails = annotatorEmail.split(',').map(s => s.trim())
          filter.annotatorEmail = emails.length === 1 ? emails[0] : { $in: emails }
        }
        if (reviewerEmail) {
          const emails = reviewerEmail.split(',').map(s => s.trim())
          filter.reviewerEmail = emails.length === 1 ? emails[0] : { $in: emails }
        }
        if (dateExact) {
          const d = new Date(dateExact)
          const next = new Date(d); next.setDate(next.getDate() + 1)
          filter.submittedAt = { $gte: d, $lt: next }
        } else if (dateFrom || dateTo) {
          const dateFilter: Record<string, Date> = {}
          if (dateFrom) dateFilter.$gte = new Date(dateFrom)
          if (dateTo) { const d = new Date(dateTo); d.setDate(d.getDate() + 1); dateFilter.$lt = d }
          filter.submittedAt = dateFilter
        }
      }
    }

    const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 }).lean()
    return NextResponse.json(tasks.map(t => serializeTask(t as unknown as Record<string, unknown>)))
  } catch (err) {
    console.error('[tasks GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    await connectToDatabase()

    const task = await Task.create({ ...body, tenantId: ctx.tenantId })

    await Batch.findByIdAndUpdate(body.batchId, { $inc: { tasksTotal: 1 } })

    return NextResponse.json(serializeTask(task.toObject() as unknown as Record<string, unknown>), { status: 201 })
  } catch (err) {
    console.error('[tasks POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
