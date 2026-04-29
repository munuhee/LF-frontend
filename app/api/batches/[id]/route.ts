import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import Task from '@/lib/models/Task'
import { requireTenant, isClientAdmin, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const tf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const batch = await Batch.findOne({ _id: id, ...tf }).lean()
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tasks = await Task.find({ batchId: id, ...tf }).sort({ priority: -1 }).lean()

    return NextResponse.json({
      id: batch._id.toString(),
      tenantId: batch.tenantId.toString(),
      projectId: batch.projectId?.toString(),
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
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await connectToDatabase()

    const tf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const batch = await Batch.findOneAndUpdate({ _id: id, ...tf }, body, { new: true }).lean()
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ id: batch._id.toString(), ...batch })
  } catch (err) {
    console.error('[batches/[id] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectToDatabase()
    const tf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const batch = await Batch.findOne({ _id: id, ...tf })
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await batch.deleteOne()
    await Task.deleteMany({ batchId: id, ...tf })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    console.error('[batches/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
