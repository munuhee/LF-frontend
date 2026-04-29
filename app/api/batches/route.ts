import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Batch from '@/lib/models/Batch'
import { requireTenant, isClientAdmin, isSuperAdmin, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const workflowId = searchParams.get('workflowId')
    const status = searchParams.get('status')
    const taskType = searchParams.get('taskType')
    const projectId = searchParams.get('projectId')
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')

    let tenantId = ctx.tenantId

    // Resolve tenantId for super_admin who may pass clientSlug/clientId as query param
    if (!isValidObjectId(tenantId) && isSuperAdmin(ctx.role)) {
      if (clientSlugParam) {
        const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
        if (client) tenantId = (client._id as { toString(): string }).toString()
      } else if (clientIdParam && isValidObjectId(clientIdParam)) {
        tenantId = clientIdParam
      }
    }

    const filter: Record<string, unknown> = isValidObjectId(tenantId) ? { tenantId } : {}
    if (workflowId) filter.workflowId = workflowId
    if (projectId) filter.projectId = projectId
    if (status && status !== 'all') filter.status = status
    if (taskType && taskType !== 'all') filter.taskType = taskType

    const batches = await Batch.find(filter).sort({ priority: -1, createdAt: -1 }).lean()

    return NextResponse.json(batches.map(b => ({
      id: b._id.toString(),
      tenantId: b.tenantId.toString(),
      projectId: b.projectId?.toString(),
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
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    await connectToDatabase()

    const batch = await Batch.create({
      ...body,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
    })

    return NextResponse.json({ id: batch._id.toString(), ...batch.toObject() }, { status: 201 })
  } catch (err) {
    console.error('[batches POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
