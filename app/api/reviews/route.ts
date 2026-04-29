import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/lib/models/Review'
import { requireTenant, isSuperAdmin, isValidObjectId } from '@/lib/tenant'

function serializeReview(r: Record<string, unknown>) {
  return {
    id: (r._id as { toString(): string }).toString(),
    tenantId: (r.tenantId as { toString(): string } | undefined)?.toString(),
    projectId: (r.projectId as { toString(): string } | undefined)?.toString(),
    taskId: (r.taskId as { toString(): string }).toString(),
    taskTitle: r.taskTitle,
    batchId: (r.batchId as { toString(): string }).toString(),
    batchTitle: r.batchTitle,
    workflowId: (r.workflowId as { toString(): string }).toString(),
    annotatorId: (r.annotatorId as { toString(): string }).toString(),
    annotatorEmail: r.annotatorEmail,
    annotatorName: r.annotatorName,
    reviewerId: r.reviewerId ? (r.reviewerId as { toString(): string }).toString() : null,
    reviewerEmail: r.reviewerEmail,
    reviewerName: r.reviewerName,
    status: r.status,
    decision: r.decision,
    comments: r.comments,
    reasonCode: r.reasonCode,
    qualityScore: r.qualityScore,
    criteriaScores: r.criteriaScores,
    submittedAt: r.submittedAt,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const { userId, role } = ctx
    let { tenantId } = ctx
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')
    const projectId = searchParams.get('projectId')
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')

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
    if (projectId) filter.projectId = projectId
    if (status && status !== 'all') filter.status = status

    if (role === 'annotator') {
      filter.annotatorId = userId
    } else if (mine === 'true' && (role === 'reviewer' || role === 'qa_lead')) {
      filter.reviewerId = userId
    }

    const reviews = await Review.find(filter).sort({ submittedAt: -1 }).lean()
    return NextResponse.json(reviews.map(r => serializeReview(r as unknown as Record<string, unknown>)))
  } catch (err) {
    console.error('[reviews GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
