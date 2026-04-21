import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import Task from '@/lib/models/Task'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()

    const batch = await Batch.findById(id).lean()
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tasks = await Task.find({ batchId: id }).sort({ priority: -1 }).lean()

    return NextResponse.json({
      id: batch._id.toString(),
      workflowId: batch.workflowId.toString(),
      workflowName: batch.workflowName,
      title: batch.title,
      description: batch.description,
      instructions: batch.instructions,
      taskType: batch.taskType,
      priority: batch.priority,
      workloadEstimate: batch.workloadEstimate,
      status: batch.status,
      tasksTotal: batch.tasksTotal,
      tasksCompleted: batch.tasksCompleted,
      deadline: batch.deadline,
      createdAt: batch.createdAt,
      tasks: tasks.map(t => ({
        id: t._id.toString(),
        batchId: t.batchId.toString(),
        batchTitle: t.batchTitle,
        workflowId: t.workflowId.toString(),
        workflowName: t.workflowName,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        status: t.status,
        priority: t.priority,
        externalUrl: t.externalUrl,
        estimatedDuration: t.estimatedDuration,
        actualDuration: t.actualDuration,
        annotatorId: t.annotatorId?.toString(),
        annotatorEmail: t.annotatorEmail,
        qualityScore: t.qualityScore,
        startedAt: t.startedAt,
        submittedAt: t.submittedAt,
      })),
    })
  } catch (err) {
    console.error('[batches/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    await connectToDatabase()

    const batch = await Batch.findByIdAndUpdate(id, body, { new: true }).lean()
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ id: batch._id.toString(), ...batch })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    await Batch.findByIdAndDelete(id)
    await Task.deleteMany({ batchId: id })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
