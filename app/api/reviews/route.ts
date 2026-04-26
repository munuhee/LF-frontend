import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Review from '@/lib/models/Review'

function serializeReview(r: Record<string, unknown>) {
  return {
    id: (r._id as { toString(): string }).toString(),
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
    await connectToDatabase()
    const userId = req.headers.get('x-user-id')!
    const role = req.headers.get('x-user-role')!
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')

    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') filter.status = status
    if (mine === 'true') {
      if (role === 'annotator') filter.annotatorId = userId
      else if (role === 'reviewer') filter.reviewerId = userId
    }
    // Admins see all

    const reviews = await Review.find(filter).sort({ submittedAt: -1 }).lean()
    return NextResponse.json(reviews.map(r => serializeReview(r as unknown as Record<string, unknown>)))
  } catch (err) {
    console.error('[reviews GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
