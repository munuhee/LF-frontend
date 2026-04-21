import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'

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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')
    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')

    const filter: Record<string, unknown> = {}
    if (batchId) filter.batchId = batchId
    if (status && status !== 'all') filter.status = status
    if (mine === 'true' && role === 'annotator') filter.annotatorId = userId
    if (mine === 'true' && role === 'reviewer') filter.reviewerId = userId

    const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 }).lean()
    return NextResponse.json(tasks.map(serializeTask))
  } catch (err) {
    console.error('[tasks GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await connectToDatabase()

    const task = await Task.create(body)

    // Increment batch tasksTotal
    await Batch.findByIdAndUpdate(body.batchId, { $inc: { tasksTotal: 1 } })

    return NextResponse.json(serializeTask(task.toObject()), { status: 201 })
  } catch (err) {
    console.error('[tasks POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
