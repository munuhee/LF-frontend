import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import Task from '@/lib/models/Task'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const workflowId = searchParams.get('workflowId')
    const status = searchParams.get('status')
    const taskType = searchParams.get('taskType')

    const filter: Record<string, unknown> = {}
    if (workflowId) filter.workflowId = workflowId
    if (status && status !== 'all') filter.status = status
    if (taskType && taskType !== 'all') filter.taskType = taskType

    const batches = await Batch.find(filter).sort({ priority: -1, createdAt: -1 }).lean()

    return NextResponse.json(batches.map(b => ({
      id: b._id.toString(),
      workflowId: b.workflowId.toString(),
      workflowName: b.workflowName,
      title: b.title,
      description: b.description,
      taskType: b.taskType,
      priority: b.priority,
      workloadEstimate: b.workloadEstimate,
      status: b.status,
      tasksTotal: b.tasksTotal,
      tasksCompleted: b.tasksCompleted,
      deadline: b.deadline,
      createdAt: b.createdAt,
    })))
  } catch (err) {
    console.error('[batches GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await connectToDatabase()

    const batch = await Batch.create({
      ...body,
      createdBy: req.headers.get('x-user-id'),
    })

    return NextResponse.json({ id: batch._id.toString(), ...batch.toObject() }, { status: 201 })
  } catch (err) {
    console.error('[batches POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
