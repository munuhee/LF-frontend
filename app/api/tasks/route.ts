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
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')
    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')
    // Admin advanced filter params
    const workflow = searchParams.get('workflow')
    const annotatorEmail = searchParams.get('annotatorEmail')
    const reviewerEmail = searchParams.get('reviewerEmail')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateExact = searchParams.get('dateExact')

    const filter: Record<string, unknown> = {}
    if (batchId) filter.batchId = batchId

    // status can be comma-separated
    if (status && status !== 'all') {
      const statuses = status.split(',').map(s => s.trim())
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    if (mine === 'true' && role === 'annotator') filter.annotatorId = userId
    if (mine === 'true' && role === 'reviewer') filter.reviewerId = userId

    // Admin filters (only honoured for admin role)
    if (role === 'admin') {
      if (workflow) {
        // Normalize: split on comma for OR values, then make each term flexible
        // e.g. "agentic-ai" → /agentic[\s\-_]+ai/i  which matches "Agentic AI Evaluation"
        const flexRegex = (term: string) => {
          const pattern = term.trim().split(/[-_\s]+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-_]+')
          return new RegExp(pattern, 'i')
        }
        const names = workflow.split(',').map(s => s.trim())
        filter.$or = names.flatMap(n => [
          { workflowName: flexRegex(n) },
          { taskType: { $regex: n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ])
      }
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

    const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 }).lean()
    return NextResponse.json(tasks.map(t => serializeTask(t as unknown as Record<string, unknown>)))
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

    return NextResponse.json(serializeTask(task.toObject() as unknown as Record<string, unknown>), { status: 201 })
  } catch (err) {
    console.error('[tasks POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
