import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'
import { requireTenant, isClientAdmin, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const tf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const workflow = await Workflow.findOne({ _id: id, ...tf }).lean()
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const batches = await Batch.find({ workflowId: id, ...tf }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      id: workflow._id.toString(),
      tenantId: workflow.tenantId.toString(),
      projectId: workflow.projectId?.toString(),
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
      batches: batches.map(b => ({
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
      })),
    })
  } catch (err) {
    console.error('[workflows/[id] GET]', err)
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

    const wf2 = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const workflow = await Workflow.findOneAndUpdate({ _id: id, ...wf2 }, body, { new: true }).lean()
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ id: workflow._id.toString(), ...workflow })
  } catch (err) {
    console.error('[workflows/[id] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await connectToDatabase()

    const wf3 = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const workflow = await Workflow.findOne({ _id: id, ...wf3 })
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.action === 'assign') {
      const { userId } = body
      if (!workflow.assignedUsers.map((u: unknown) => u?.toString()).includes(userId)) {
        workflow.assignedUsers.push(userId)
        await workflow.save()
      }
    } else if (body.action === 'unassign') {
      const { userId } = body
      workflow.assignedUsers = workflow.assignedUsers.filter((u: unknown) => u?.toString() !== userId) as typeof workflow.assignedUsers
      await workflow.save()
    }

    return NextResponse.json({
      id: workflow._id.toString(),
      assignedUsers: workflow.assignedUsers.map((u: unknown) => u?.toString()),
    })
  } catch (err) {
    console.error('[workflows/[id] PATCH]', err)
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
    const wf4 = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const result = await Workflow.findOneAndDelete({ _id: id, ...wf4 })
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    console.error('[workflows/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
